import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowRight, User, MagnifyingGlass, ChartBar, CurrencyDollar, CheckCircle } from '@phosphor-icons/react';

interface PipelineItem {
  id: string;
  name: string;
  stage: 'leads' | 'scout' | 'sentiment' | 'pricing' | 'verdict';
  score?: number;
  status: 'pending' | 'in-progress' | 'complete';
}

const mockPipeline: PipelineItem[] = [
  { id: '1', name: 'KI/KI', stage: 'verdict', score: 68, status: 'complete' },
  { id: '2', name: 'Armin van Buuren', stage: 'pricing', score: 85, status: 'in-progress' },
  { id: '3', name: 'Tale of Us', stage: 'sentiment', score: 72, status: 'in-progress' },
  { id: '4', name: 'John Summit', stage: 'scout', status: 'in-progress' },
  { id: '5', name: 'KSHMR', stage: 'leads', status: 'pending' },
  { id: '6', name: 'Anyma', stage: 'leads', status: 'pending' },
];

const stages = [
  { key: 'leads', label: 'Leads', icon: <User size={20} />, color: 'text-cyber-text-dim' },
  { key: 'scout', label: 'Scout Review', icon: <MagnifyingGlass size={20} />, color: 'text-cyber-cyan' },
  { key: 'sentiment', label: 'Sentiment', icon: <ChartBar size={20} />, color: 'text-cyber-purple' },
  { key: 'pricing', label: 'Pricing', icon: <CurrencyDollar size={20} />, color: 'text-cyber-yellow' },
  { key: 'verdict', label: 'Verdict', icon: <CheckCircle size={20} />, color: 'text-cyber-green' },
];

export default function Pipeline() {
  const getItemsByStage = (stage: string) => {
    return mockPipeline.filter(item => item.stage === stage);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'border-cyber-green';
      case 'in-progress': return 'border-cyber-cyan';
      default: return 'border-cyber-border';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="fade-in-up">
        <h1 className="cyber-heading text-4xl font-bold mb-2">Artist Pipeline</h1>
        <p className="text-cyber-text-secondary font-body">
          Track artist research from lead to verdict
        </p>
      </div>

      {/* Pipeline Stats */}
      <div className="grid grid-cols-5 gap-4 fade-in-up stagger-1">
        {stages.map((stage) => {
          const count = getItemsByStage(stage.key).length;
          return (
            <Card key={stage.key} className="cyber-card cyber-glow-hover">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className={stage.color}>{stage.icon}</div>
                  <span className="font-mono text-2xl font-bold">{count}</span>
                </div>
                <p className="text-xs text-cyber-text-dim uppercase tracking-wide">
                  {stage.label}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-5 gap-4">
        {stages.map((stage, stageIndex) => (
          <div key={stage.key} className={`fade-in-up stagger-${stageIndex + 2}`}>
            {/* Column Header */}
            <div className="cyber-card p-4 mb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className={stage.color}>{stage.icon}</div>
                <h3 className="font-heading text-sm font-bold uppercase">
                  {stage.label}
                </h3>
              </div>
              <div className="cyber-progress mt-3">
                <div 
                  className="cyber-progress-bar" 
                  style={{ width: `${(getItemsByStage(stage.key).length / mockPipeline.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Column Items */}
            <div className="space-y-3">
              {getItemsByStage(stage.key).map((item) => (
                <Card 
                  key={item.id} 
                  className={`cyber-card cyber-glow-hover cursor-pointer ${getStatusColor(item.status)}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-medium text-sm">{item.name}</h4>
                      {item.score && (
                        <span className="cyber-badge cyber-badge-info text-[10px]">
                          {item.score}/100
                        </span>
                      )}
                    </div>
                    
                    {item.status === 'in-progress' && (
                      <div className="flex items-center gap-2 text-xs text-cyber-yellow">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyber-yellow animate-pulse" />
                        <span className="font-mono">Processing...</span>
                      </div>
                    )}
                    
                    {item.status === 'complete' && (
                      <div className="flex items-center gap-2 text-xs text-cyber-green">
                        <CheckCircle size={14} weight="fill" />
                        <span className="font-mono">Complete</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              
              {getItemsByStage(stage.key).length === 0 && (
                <div className="cyber-card p-4 text-center">
                  <p className="text-xs text-cyber-text-dim">No items</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="cyber-card fade-in-up stagger-6">
        <CardHeader>
          <CardTitle className="font-heading text-sm">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <button className="cyber-card cyber-glow-hover p-4 text-left transition-all">
              <div className="flex items-center gap-3 mb-2">
                <MagnifyingGlass size={20} className="text-cyber-cyan" />
                <span className="font-heading text-sm font-bold">Add Lead</span>
              </div>
              <p className="text-xs text-cyber-text-dim">
                Add new artist to pipeline
              </p>
            </button>
            
            <button className="cyber-card cyber-glow-hover p-4 text-left transition-all">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle size={20} className="text-cyber-green" />
                <span className="font-heading text-sm font-bold">View Verdicts</span>
              </div>
              <p className="text-xs text-cyber-text-dim">
                See completed artist briefs
              </p>
            </button>
            
            <button className="cyber-card cyber-glow-hover p-4 text-left transition-all">
              <div className="flex items-center gap-3 mb-2">
                <ArrowRight size={20} className="text-cyber-purple" />
                <span className="font-heading text-sm font-bold">Bulk Process</span>
              </div>
              <p className="text-xs text-cyber-text-dim">
                Run Scout on multiple artists
              </p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
