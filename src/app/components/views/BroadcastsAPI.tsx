import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, Eye, Trash2, RefreshCw, MessageSquare, FileText, 
  Send, RotateCcw, Loader2, Users, CheckCircle2, AlertCircle, 
  Clock, Info, ChevronRight, X
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { broadcastsService } from '../../services/broadcasts.service';
import { classesService } from '../../services/classes.service';
import { sectionsService } from '../../services/sections.service';
import { toast } from 'sonner';
import type { Broadcast, WhatsAppTemplate, Class, Section } from '../../types';
import { useApp } from '../../context/AppContext';

type Tab = 'campaigns' | 'templates';

export default function BroadcastsAPI() {
  const { goBack } = useApp();
  const [tab, setTab] = useState<Tab>('campaigns');
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [metaTemplates, setMetaTemplates] = useState<WhatsAppTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  
  // Form State
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    templateName: '',
    targetType: 'ALL',
    classId: '',
    sectionId: '',
    params: [] as string[]
  });

  const [selectedBroadcastId, setSelectedBroadcastId] = useState<number | null>(null);
  const [stats, setStats] = useState<{ total: number; sent: number; delivered: number; failed: number; pending: number } | null>(null);

  const loadBroadcasts = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await broadcastsService.getAll(statusFilter !== 'all' ? statusFilter : undefined);
      setBroadcasts(data);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load campaigns');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [statusFilter]);

  const loadMetaTemplates = async () => {
    setLoading(true);
    try {
      const data = await broadcastsService.getWhatsAppTemplatesMeta();
      setMetaTemplates(data.filter(t => t.status === 'APPROVED'));
    } catch (e: any) {
      toast.error('Failed to load Meta templates. Check WhatsApp API configuration.');
    } finally {
      setLoading(false);
    }
  };

  const loadTargetOptions = async () => {
    try {
      const [cls, sec] = await Promise.all([
        classesService.getForDropdown(),
        sectionsService.getForDropdown()
      ]);
      setClasses(cls);
      setSections(sec);
    } catch (e) {}
  };

  useEffect(() => {
    if (tab === 'campaigns') loadBroadcasts();
    else loadMetaTemplates();
  }, [tab, loadBroadcasts]);

  // Auto-refresh for active broadcasts
  useEffect(() => {
    const active = broadcasts.some(b => b.status === 'processing' || b.status === 'pending');
    if (active) {
      const timer = setInterval(() => loadBroadcasts(true), 5000);
      return () => clearInterval(timer);
    }
  }, [broadcasts, loadBroadcasts]);

  useEffect(() => {
    if (selectedBroadcastId) {
      broadcastsService.getStats(selectedBroadcastId).then(setStats).catch(() => setStats(null));
    }
  }, [selectedBroadcastId]);

  const handleTemplateSelect = (templateName: string) => {
    const template = metaTemplates.find(t => t.name === templateName);
    if (!template) return;

    // Count body variables
    const bodyComponent = template.components?.find(c => c.type === 'BODY');
    const variableCount = (bodyComponent?.text?.match(/{{(\d+)}}/g) || []).length;
    
    setCampaignForm(prev => ({
      ...prev,
      templateName,
      params: new Array(variableCount).fill('')
    }));
  };

  const handleCreateCampaign = async () => {
    if (!campaignForm.name || !campaignForm.templateName) {
      toast.error('Name and Template are required');
      return;
    }

    setLoading(true);
    try {
      const template = metaTemplates.find(t => t.name === campaignForm.templateName);
      await broadcastsService.createWithRecipients(
        {
          name: campaignForm.name,
          templateId: template?.id as string || '',
          templateName: campaignForm.templateName,
          templateLanguage: template?.language || 'en',
          templateParams: { body: campaignForm.params },
        },
        {
          targetType: campaignForm.targetType,
          classId: campaignForm.classId,
          sectionId: campaignForm.sectionId
        }
      );
      toast.success('Campaign created and queued for sending!');
      setShowCreateCampaign(false);
      setCampaignForm({ name: '', templateName: '', targetType: 'ALL', classId: '', sectionId: '', params: [] });
      loadBroadcasts();
    } catch (e: any) {
      toast.error(e.message || 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBroadcast = async (id: number) => {
    if (!confirm('Delete this campaign?')) return;
    try {
      await broadcastsService.delete(id);
      toast.success('Campaign deleted');
      if (selectedBroadcastId === id) setSelectedBroadcastId(null);
      loadBroadcasts();
    } catch (e: any) {
      toast.error(e.message || 'Delete failed');
    }
  };

  const handleRetryFailed = async (id: number) => {
    try {
      await broadcastsService.retryFailed(id);
      toast.success('Retry started');
      loadBroadcasts();
    } catch (e: any) {
      toast.error(e.message || 'Retry failed');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle2 className="w-3 h-3 mr-1" /> Sent</Badge>;
      case 'processing': return <Badge className="bg-blue-100 text-blue-800 border-blue-200"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Sending</Badge>;
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><Clock className="w-3 h-3 mr-1" /> Queued</Badge>;
      case 'completed_with_errors': return <Badge className="bg-orange-100 text-orange-800 border-orange-200"><AlertCircle className="w-3 h-3 mr-1" /> Partial</Badge>;
      case 'failed': return <Badge className="bg-red-100 text-red-800 border-red-200"><X className="w-3 h-3 mr-1" /> Failed</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">WhatsApp Broadcasts</h1>
          <p className="text-muted-foreground">Manage and send scalable WhatsApp campaigns to students.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => tab === 'campaigns' ? loadBroadcasts() : loadMetaTemplates()}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={() => { setShowCreateCampaign(true); loadTargetOptions(); loadMetaTemplates(); }}>
            <Plus className="w-4 h-4 mr-2" /> New Campaign
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <button 
          className={`px-6 py-3 font-medium text-sm transition-colors relative ${tab === 'campaigns' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          onClick={() => setTab('campaigns')}
        >
          Campaigns
          {tab === 'campaigns' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
        </button>
        <button 
          className={`px-6 py-3 font-medium text-sm transition-colors relative ${tab === 'templates' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          onClick={() => setTab('templates')}
        >
          App Templates
          {tab === 'templates' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
        </button>
      </div>

      {tab === 'campaigns' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main List */}
          <Card className="lg:col-span-2 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-xl">Recent Campaigns</CardTitle>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px] h-9">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Campaigns</SelectItem>
                  <SelectItem value="pending">Queued</SelectItem>
                  <SelectItem value="processing">Sending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-muted-foreground font-medium border-y">
                    <tr>
                      <th className="text-left py-3 px-4">Campaign</th>
                      <th className="text-left py-3 px-4">Template</th>
                      <th className="text-center py-3 px-4">Recipients</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-right py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {broadcasts.length === 0 && !loading ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-muted-foreground">
                          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                          <p>No campaigns found.</p>
                        </td>
                      </tr>
                    ) : broadcasts.map((b) => (
                      <tr key={b.id} className={`hover:bg-muted/30 transition-colors ${selectedBroadcastId === b.id ? 'bg-primary/5' : ''}`}>
                        <td className="py-4 px-4 font-medium">
                          <div className="flex flex-col">
                            <span>{b.name}</span>
                            <span className="text-xs text-muted-foreground font-normal">{new Date(b.createdAt as string).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-muted-foreground">{b.templateName}</td>
                        <td className="py-4 px-4 text-center">{b.totalRecipients}</td>
                        <td className="py-4 px-4">{getStatusBadge(b.status)}</td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => setSelectedBroadcastId(b.id === selectedBroadcastId ? null : b.id)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            {b.status === 'completed_with_errors' && (
                              <Button variant="ghost" size="icon" onClick={() => handleRetryFailed(b.id)} title="Retry errors">
                                <RotateCcw className="w-4 h-4 text-orange-600" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteBroadcast(b.id)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Stats Sidebar */}
          <div className="space-y-6">
            {selectedBroadcastId ? (
              <Card className="shadow-md border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Info className="w-4 h-4 text-primary" /> Delivery Stats
                  </CardTitle>
                  <CardDescription>Details for Campaign #{selectedBroadcastId}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {stats ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-white rounded-lg border flex flex-col items-center">
                        <span className="text-2xl font-bold">{stats.total}</span>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Total</span>
                      </div>
                      <div className="p-3 bg-white rounded-lg border flex flex-col items-center text-green-600 shadow-sm shadow-green-100">
                        <span className="text-2xl font-bold">{stats.sent + stats.delivered}</span>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Sent</span>
                      </div>
                      <div className="p-3 bg-white rounded-lg border flex flex-col items-center text-blue-600">
                        <span className="text-2xl font-bold">{stats.pending}</span>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Pending</span>
                      </div>
                      <div className="p-3 bg-white rounded-lg border flex flex-col items-center text-destructive shadow-sm shadow-red-100">
                        <span className="text-2xl font-bold">{stats.failed}</span>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Failed</span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>
                  )}
                  <Button variant="outline" className="w-full bg-white" onClick={() => setSelectedBroadcastId(null)}>Hide Stats</Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-sm bg-muted/20 border-dashed">
                <CardContent className="py-12 flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Eye className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium text-muted-foreground">No Campaign Selected</h3>
                  <p className="text-xs text-muted-foreground max-w-xs mt-1">Select a campaign from the list to view its real-time delivery performance.</p>
                </CardContent>
              </Card>
            )}
            
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Pro Tips</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-3 text-muted-foreground">
                <div className="flex gap-2">
                  <div className="h-5 w-5 bg-primary/10 rounded flex items-center justify-center text-primary text-[10px] font-bold">1</div>
                  <p>Use variables like <code className="bg-muted px-1 rounded">{"{{name}}"}</code> in your Meta templates for auto-personalization.</p>
                </div>
                <div className="flex gap-2">
                  <div className="h-5 w-5 bg-primary/10 rounded flex items-center justify-center text-primary text-[10px] font-bold">2</div>
                  <p>Large broadcasts are processed in batches of 20 to avoid WhatsApp rate limiting.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {tab === 'templates' && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Meta Approved Templates</CardTitle>
            <CardDescription>Templates fetched directly from your WhatsApp Cloud API account.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-muted-foreground font-medium border-y">
                  <tr>
                    <th className="text-left py-3 px-4">Name</th>
                    <th className="text-left py-3 px-4">Category</th>
                    <th className="text-left py-3 px-4">Language</th>
                    <th className="text-center py-3 px-4">Status</th>
                    <th className="text-right py-3 px-4">Preview</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {metaTemplates.length === 0 && !loading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No templates found on Meta. Ensure your API credentials are correct.</p>
                      </td>
                    </tr>
                  ) : metaTemplates.map((t) => (
                    <tr key={String(t.id)} className="hover:bg-muted/30 transition-colors">
                      <td className="py-4 px-4 font-medium">{t.name}</td>
                      <td className="py-4 px-4 text-muted-foreground capitalize">{t.category}</td>
                      <td className="py-4 px-4 uppercase text-xs">{t.language}</td>
                      <td className="py-4 px-4 text-center">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">{t.status}</Badge>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="max-w-[200px] inline-block truncate text-xs text-muted-foreground italic border-l pl-2">
                          {t.components?.find(c => c.type === 'BODY')?.text?.substring(0, 50)}...
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* New Campaign Modal */}
      {showCreateCampaign && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <div>
                <CardTitle>Create New Broadcast</CardTitle>
                <CardDescription>Target your audience and pick a template.</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowCreateCampaign(false)}><X className="w-4 h-4" /></Button>
            </CardHeader>
            <CardContent className="pt-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Campaign Basic Info */}
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Campaign Name</Label>
                  <Input 
                    id="name" 
                    value={campaignForm.name} 
                    onChange={(e) => setCampaignForm((p) => ({ ...p, name: e.target.value }))} 
                    placeholder="e.g., Annual Exam Results March 2024" 
                  />
                </div>

                <div className="space-y-2">
                  <Label>WhatsApp Template</Label>
                  <Select value={campaignForm.templateName} onValueChange={handleTemplateSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an approved template" />
                    </SelectTrigger>
                    <SelectContent>
                      {metaTemplates.map((t) => (
                        <SelectItem key={String(t.id)} value={t.name}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {campaignForm.templateName && (
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1 p-2 bg-muted rounded">
                      <Info className="w-3 h-3" /> Note: Only text variables are currently supported.
                    </div>
                  )}
                </div>
              </div>

              {/* Targeting */}
              <div className="space-y-4 pt-4 border-t">
                <Label className="text-base font-semibold">Audience Selection</Label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg">
                  {[
                    { id: 'ALL', label: 'All Students', icon: Users },
                    { id: 'CLASS', label: 'By Class', icon: FileText },
                    { id: 'SECTION', label: 'By Section', icon: ChevronRight },
                  ].map((target) => (
                    <button
                      key={target.id}
                      className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-all ${campaignForm.targetType === target.id ? 'bg-white shadow text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                      onClick={() => setCampaignForm(p => ({ ...p, targetType: target.id }))}
                    >
                      <target.icon className="w-4 h-4" /> {target.label}
                    </button>
                  ))}
                </div>

                {campaignForm.targetType === 'CLASS' && (
                  <div className="animate-in slide-in-from-top-1">
                    <Label htmlFor="class">Select Class</Label>
                    <Select value={campaignForm.classId} onValueChange={(v) => setCampaignForm(p => ({ ...p, classId: v }))}>
                      <SelectTrigger id="class"><SelectValue placeholder="Choose class..." /></SelectTrigger>
                      <SelectContent>
                        {classes.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {campaignForm.targetType === 'SECTION' && (
                  <div className="grid grid-cols-2 gap-2 animate-in slide-in-from-top-1">
                    <div className="space-y-2">
                      <Label htmlFor="class_sec">Class</Label>
                      <Select value={campaignForm.classId} onValueChange={(v) => setCampaignForm(p => ({ ...p, classId: v }))}>
                        <SelectTrigger id="class_sec"><SelectValue placeholder="Class" /></SelectTrigger>
                        <SelectContent>
                          {classes.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="section">Section</Label>
                      <Select value={campaignForm.sectionId} onValueChange={(v) => setCampaignForm(p => ({ ...p, sectionId: v }))}>
                        <SelectTrigger id="section"><SelectValue placeholder="Section" /></SelectTrigger>
                        <SelectContent>
                          {sections.filter(s => !campaignForm.classId || s.classId === campaignForm.classId).map((s) => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

              {/* Template Parameters */}
              {campaignForm.params.length > 0 && (
                <div className="space-y-4 pt-4 border-t">
                  <Label className="text-base font-semibold">Template Variables</Label>
                  <p className="text-xs text-muted-foreground">Fill in the custom values for your message placeholders.</p>
                  <div className="space-y-3">
                    {campaignForm.params.map((val, idx) => (
                      <div key={idx} className="space-y-1.5">
                        <Label className="text-xs font-normal">Placeholder {"{{"}{idx+1}{"}}"}</Label>
                        <Input 
                          value={val} 
                          onChange={(e) => {
                            const newParams = [...campaignForm.params];
                            newParams[idx] = e.target.value;
                            setCampaignForm(p => ({ ...p, params: newParams }));
                          }}
                          placeholder={`Value for variable ${idx+1}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-6 border-t font-semibold">
                <Button className="flex-1 h-11" onClick={handleCreateCampaign} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />} 
                  Schedule Broadcast
                </Button>
                <Button variant="ghost" className="h-11" onClick={() => setShowCreateCampaign(false)}>Cancel</Button>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg flex gap-3 border border-blue-100">
                <div className="mt-0.5"><Info className="w-4 h-4 text-blue-600" /></div>
                <p className="text-[10px] text-blue-700 leading-relaxed">
                  <strong>Scalability Note:</strong> For large audiences, we use background batching. You can close this window after starting; the system will continue processing your messages.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
