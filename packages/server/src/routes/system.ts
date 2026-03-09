import { FastifyPluginAsync } from 'fastify';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile } from 'fs/promises';

const execAsync = promisify(exec);

const systemRoutes: FastifyPluginAsync = async (fastify) => {
  // Get system information
  fastify.get('/info', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      // Get OpenClaw version
      const { stdout: openclawVersion } = await execAsync('openclaw --version 2>/dev/null || echo "unknown"');
      
      // Get latest available version
      const { stdout: latestVersion } = await execAsync('npm view openclaw version 2>/dev/null || echo "unknown"');
      
      // Read last security scan date from our audit report
      let lastSecurityScan = null;
      try {
        const auditReport = await readFile('/root/SECURITY_FIXES_APPLIED.md', 'utf-8');
        const match = auditReport.match(/Security Fixes Applied.*(\d{4}-\d{2}-\d{2})/);
        if (match) {
          lastSecurityScan = match[1];
        }
      } catch {
        // File doesn't exist yet
      }
      
      return {
        openclaw: {
          currentVersion: openclawVersion.trim(),
          latestVersion: latestVersion.trim(),
          updateAvailable: openclawVersion.trim() !== latestVersion.trim() && latestVersion.trim() !== 'unknown',
        },
        security: {
          lastScanDate: lastSecurityScan || '2026-03-03', // Default to when we did the security fixes
        },
        missionControl: {
          version: 'Phase 2C',
          environment: process.env.NODE_ENV || 'development',
        },
      };
    } catch (error) {
      fastify.log.error(error, 'Failed to get system info');
      reply.code(500).send({ error: 'Failed to get system info' });
    }
  });

  // Check for OpenClaw updates
  fastify.post('/check-updates', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { stdout: currentVersion } = await execAsync('openclaw --version 2>/dev/null');
      const { stdout: latestVersion } = await execAsync('npm view openclaw version 2>/dev/null');
      const { stdout: changelog } = await execAsync('npm view openclaw --json 2>/dev/null | head -20');
      
      const updateAvailable = currentVersion.trim() !== latestVersion.trim();
      
      return {
        current: currentVersion.trim(),
        latest: latestVersion.trim(),
        updateAvailable,
        changelog: updateAvailable ? 'Update available' : 'Up to date',
      };
    } catch (error) {
      fastify.log.error(error, 'Failed to check updates');
      reply.code(500).send({ error: 'Failed to check updates' });
    }
  });

  // Verify sync password
  fastify.post('/verify-sync-password', { preHandler: [fastify.authenticate, fastify.requireAdmin] }, async (request, reply) => {
    const { password } = request.body as { password: string };
    
    const correctPassword = 'BROWNCHICKENBROWNCOW';
    
    if (password === correctPassword) {
      return { valid: true };
    } else {
      reply.code(401).send({ valid: false, error: 'Incorrect password' });
    }
  });

  // Update OpenClaw (admin only)
  fastify.post('/update-openclaw', { preHandler: [fastify.authenticate, fastify.requireAdmin] }, async (request, reply) => {
    try {
      fastify.log.info('Starting OpenClaw update...');
      
      // Get current version
      const { stdout: currentVersion } = await execAsync('openclaw --version 2>/dev/null');
      
      // Update OpenClaw
      const { stdout: updateOutput, stderr: updateError } = await execAsync('npm install -g openclaw@latest 2>&1', {
        timeout: 120000, // 2 minute timeout
      });
      
      fastify.log.info({ updateOutput }, 'OpenClaw update output');
      
      // Get new version
      const { stdout: newVersion } = await execAsync('openclaw --version 2>/dev/null');
      
      // Check if update was successful
      if (newVersion.trim() === currentVersion.trim()) {
        return {
          success: false,
          error: 'Update completed but version unchanged',
          currentVersion: currentVersion.trim(),
          newVersion: newVersion.trim(),
          output: updateOutput,
        };
      }
      
      return {
        success: true,
        currentVersion: currentVersion.trim(),
        newVersion: newVersion.trim(),
        message: 'OpenClaw updated successfully. Gateway restart recommended.',
        output: updateOutput,
      };
    } catch (error: any) {
      fastify.log.error(error, 'Failed to update OpenClaw');
      reply.code(500).send({ 
        success: false,
        error: 'Update failed: ' + error.message,
        stderr: error.stderr || '',
      });
    }
  });

  // Restart OpenClaw Gateway (admin only)
  fastify.post('/restart-gateway', { preHandler: [fastify.authenticate, fastify.requireAdmin] }, async (request, reply) => {
    try {
      fastify.log.info('Restarting OpenClaw gateway...');
      
      // Restart gateway (fire and forget, will kill this process)
      execAsync('sleep 2 && systemctl restart openclaw-gateway 2>&1').catch(() => {
        // Ignore errors since process will be killed
      });
      
      return {
        success: true,
        message: 'Gateway restart initiated. Reconnect in 10 seconds.',
      };
    } catch (error: any) {
      fastify.log.error(error, 'Failed to restart gateway');
      reply.code(500).send({ 
        success: false,
        error: 'Restart failed: ' + error.message,
      });
    }
  });
};

export default systemRoutes;
