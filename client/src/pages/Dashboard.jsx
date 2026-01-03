import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../api.js';
import { fmtBRL, fmtDate, statusLabel, todayIso } from '../utils.js';
import {
  Moon,
  Sun,
  LogOut,
  Plus,
  RefreshCw,
  Users,
  BarChart3,
  FileText,
  Settings2,
  KeyRound,
  Trash2,
  Pencil,
  Download
} from 'lucide-react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);


function Shell({ darkMode, children }) {
  return (
    <div
      className={`min-h-screen transition-colors duration-500 ${
        darkMode
          ? 'dark bg-[#070A14] text-white'
          : 'bg-gradient-to-br from-slate-50 via-white to-slate-50 text-slate-900'
      }`}
    >
      {/* cinematic background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-stars" />
        <div className="absolute -top-32 -left-24 w-[520px] h-[520px] rounded-full bg-violet-600/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-28 w-[560px] h-[560px] rounded-full bg-cyan-500/16 blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-[520px] h-[520px] rounded-full bg-fuchsia-500/12 blur-3xl" />
      </div>
      {children}
    </div>
  );
}

function Pill({ icon: Icon, label, value, tone='violet' }) {
  const map = {
    violet: 'from-violet-600 to-purple-600 shadow-violet-600/25',
    emerald: 'from-emerald-600 to-teal-600 shadow-emerald-600/25',
    cyan: 'from-cyan-600 to-blue-600 shadow-cyan-600/25',
    amber: 'from-amber-500 to-orange-600 shadow-amber-600/25',
    rose: 'from-rose-600 to-pink-600 shadow-rose-600/25'
  };
  return (
    <div className={`rounded-3xl p-5 bg-gradient-to-r ${map[tone]} shadow-xl`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-white/70">{label}</div>
          <div className="text-2xl font-bold text-white mt-1">{value}</div>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-violet-500/15 border border-violet-400/20 flex items-center justify-center">
          <Icon className="w-5 h-5 text-violet-300" />
        </div>
        <div>
          <div className="text-lg font-semibold">{title}</div>
          {subtitle && <div className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</div>}
        </div>
      </div>
    </div>
  );
}

function Modal({ open, title, children, onClose, widthClass='max-w-3xl' }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className={`relative w-full ${widthClass} rounded-3xl bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-white/10 shadow-2xl overflow-hidden`}>
        <div className="px-6 py-5 border-b border-slate-200/60 dark:border-white/10 flex items-center justify-between">
          <div className="font-semibold">{title}</div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">✕</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function TextInput({ label, value, onChange, type='text', placeholder, required }) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}{required && <span className="text-rose-400">*</span>}</div>
      <input
        type={type}
        value={value}
        onChange={(e)=>onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
      />
    </div>
  );
}

function SelectInput({ label, value, onChange, options, required }) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}{required && <span className="text-rose-400">*</span>}</div>
      <select
        value={value}
        onChange={(e)=>onChange(e.target.value)}
        className="w-full rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
      >
        <option value="">Selecione…</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function SaleForm({ open, onClose, onSave, consultants, user, editing }) {
  const isAdmin = user.role === 'admin';
  const [consultantId, setConsultantId] = useState(editing?.consultant_id ? String(editing.consultant_id) : '');
  const [clientName, setClientName] = useState(editing?.client_name || '');
  const [product, setProduct] = useState(editing?.product || 'Imóvel');
  const [saleDate, setSaleDate] = useState(editing?.sale_date || todayIso());
  const [insurance, setInsurance] = useState(Boolean(editing?.insurance));
  const [baseValue, setBaseValue] = useState(editing?.base_value ?? '');
  const [quotas, setQuotas] = useState(editing?.quotas ?? 1);
  const [unitValue, setUnitValue] = useState(editing?.unit_value ?? 0);
  const [commissionPct, setCommissionPct] = useState(editing?.commission_percentage ?? 0.8);
  const [creditGenerated, setCreditGenerated] = useState(editing?.credit_generated ?? 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setConsultantId(editing?.consultant_id ? String(editing.consultant_id) : '');
    setClientName(editing?.client_name || '');
    setProduct(editing?.product || 'Imóvel');
    setSaleDate(editing?.sale_date || todayIso());
    setInsurance(Boolean(editing?.insurance));
    setBaseValue(editing?.base_value ?? '');
    setQuotas(editing?.quotas ?? 1);
    setUnitValue(editing?.unit_value ?? 0);
    setCommissionPct(editing?.commission_percentage ?? 0.8);
    setCreditGenerated(editing?.credit_generated ?? 0);
  }, [open, editing]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave({
        consultant_id: isAdmin ? Number(consultantId) : undefined,
        client_name: clientName,
        product,
        sale_date: saleDate,
        insurance,
        base_value: Number(baseValue),
        quotas: Number(quotas),
        unit_value: Number(unitValue),
        commission_percentage: Number(commissionPct),
        credit_generated: Number(creditGenerated)
      });
      onClose();
    } catch (err) {
      setError('Confira os campos obrigatórios.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Editar venda' : 'Nova venda'} widthClass="max-w-4xl">
      <form onSubmit={submit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isAdmin && (
            <SelectInput
              label="Consultor"
              required
              value={consultantId}
              onChange={setConsultantId}
              options={consultants.map(c=>({ value: String(c.id), label: c.name }))}
            />
          )}
          <TextInput label="Cliente" required value={clientName} onChange={setClientName} placeholder="Nome do cliente" />
          <SelectInput
            label="Produto"
            required
            value={product}
            onChange={setProduct}
            options={['Imóvel','Auto','Moto','Agro','Serviços'].map(x=>({ value:x, label:x }))}
          />
          <TextInput label="Data da venda" required type="date" value={saleDate} onChange={setSaleDate} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <TextInput label="Base (R$)" required type="number" value={baseValue} onChange={setBaseValue} placeholder="Ex: 100000" />
          <TextInput label="% Comissão" required type="number" value={commissionPct} onChange={setCommissionPct} placeholder="Ex: 0.8" />
          <TextInput label="Qtd cotas" type="number" value={quotas} onChange={setQuotas} />
          <TextInput label="Valor unitário" type="number" value={unitValue} onChange={setUnitValue} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextInput label="Crédito gerado (R$)" type="number" value={creditGenerated} onChange={setCreditGenerated} />
          <div className="flex items-end">
            <label className="flex items-center gap-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 py-3 w-full">
              <input type="checkbox" checked={insurance} onChange={(e)=>setInsurance(e.target.checked)} />
              <span className="text-sm text-slate-700 dark:text-slate-200 font-medium">Com seguro</span>
            </label>
          </div>
        </div>

        {error && <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-600 dark:text-rose-200">{error}</div>}

        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="px-5 py-3 rounded-2xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5">Cancelar</button>
          <button disabled={saving} className="px-5 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold shadow-lg shadow-violet-600/20 disabled:opacity-60">{saving ? 'Salvando…' : 'Salvar'}</button>
        </div>
      </form>
    </Modal>
  );
}

/* =========================
   HELPERS PARCELAS
========================= */

function isOverdue(due_date) {
  if (!due_date) return false;
  // comparando yyyy-mm-dd (string) funciona bem
  return String(due_date) < todayIso();
}

function normalizeInstallmentForUi(it) {
  // status "overdue" automático no front se estiver pendente e vencido
  const paid = it.status === 'paid' || !!it.paid_date;
  const overdueAuto = !paid && isOverdue(it.due_date);
  const status = paid ? 'paid' : (overdueAuto ? 'overdue' : 'pending');
  return {
    number: Number(it.number),
    value: Number(it.value || 0),
    due_date: String(it.due_date),
    status,
    paid_date: it.paid_date ? String(it.paid_date) : null
  };
}

export default function Dashboard({ user, onLogout }) {
  const [darkMode, setDarkMode] = useState(true);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState([]);
  const [consultants, setConsultants] = useState([]);
  const [summary, setSummary] = useState(null);

  const [saleFormOpen, setSaleFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [details, setDetails] = useState(null);

  // edição de parcelas
  const [editingInstallments, setEditingInstallments] = useState([]);
  const [savingInstallments, setSavingInstallments] = useState(false);
  const [installmentsMsg, setInstallmentsMsg] = useState('');

  const isAdmin = user.role === 'admin';

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const load = async () => {
    setLoading(true);
    try {
      const [c, s, sum] = await Promise.all([
        api.listConsultants(),
        api.listSales(),
        fetch('/api/summary', { credentials: 'include' }).then(r => r.ok ? r.json() : null)
      ]);
      setConsultants(c);
      setSales(s);
      setSummary(sum);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    // toda vez que abrir detalhes, prepara parcelas editáveis
    if (!details) {
      setEditingInstallments([]);
      setInstallmentsMsg('');
      return;
    }
    const list = (details.installments || []).map(normalizeInstallmentForUi).sort((a,b)=>a.number-b.number);
    setEditingInstallments(list);
    setInstallmentsMsg('');
  }, [details]);

  const kpis = useMemo(() => {
    const total = sales.reduce((a, x) => a + Number(x.total_commission || 0), 0);
    let paid = 0, pending = 0, overdue = 0;

    for (const s of sales) {
      for (const it0 of (s.installments || [])) {
        const it = normalizeInstallmentForUi(it0);
        const v = Number(it.value || 0);
        if (it.status === 'paid') paid += v;
        else if (it.status === 'overdue') overdue += v;
        else pending += v;
      }
    }

    const credit = sales.reduce((a, x) => a + Number(x.credit_generated || 0), 0);
    return { total, paid, pending, overdue, credit, count: sales.length };
  }, [sales]);

  const ranking = useMemo(() => {
    const map = new Map();
    for (const s of sales) {
      const key = s.consultant_name || '—';
      map.set(key, (map.get(key) || 0) + Number(s.total_commission || 0));
    }
    return [...map.entries()].map(([name, value]) => ({ name, value }))
      .sort((a,b)=>b.value - a.value);
  }, [sales]);

  const chartBar = useMemo(() => {
    const top = ranking.slice(0, 6);
    return {
      data: {
        labels: top.map(x => x.name),
        datasets: [{
          label: 'Comissão total (R$)',
          data: top.map(x => Math.round(x.value * 100) / 100)
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } }
      }
    };
  }, [ranking]);

  const chartDonut = useMemo(() => ({
    data: {
      labels: ['Pago', 'Pendente', 'Atrasado'],
      datasets: [{
        data: [kpis.paid, kpis.pending, kpis.overdue]
      }]
    },
    options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
  }), [kpis]);

  const logout = async () => {
    await api.logout();
    onLogout();
  };

  const downloadExcel = async () => {
    const scope = isAdmin ? 'all' : 'me';
    const resp = await fetch(`/api/export/xlsx?scope=${scope}`, { credentials: 'include' });
    if (!resp.ok) {
      alert('Não foi possível exportar agora. Faça login novamente e tente de novo.');
      return;
    }
    const blob = await resp.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `export-${scope}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const saveSale = async (payload) => {
    if (editing) {
      await api.updateSale(editing.id, payload);
      setEditing(null);
    } else {
      await api.createSale(payload);
    }
    await load();
  };

  const deleteSale = async (id) => {
    await api.deleteSale(id);
    setDetails(null);
    await load();
  };

  const setInstallmentUiStatus = (number, newUiStatus) => {
    setEditingInstallments(prev => prev.map(it => {
      if (it.number !== number) return it;

      if (newUiStatus === 'paid') {
        return { ...it, status: 'paid', paid_date: todayIso() };
      }
      // pending: se está vencida, vai aparecer como atrasada automaticamente (normalize)
      return { ...it, status: 'pending', paid_date: null };
    }));
  };

  const saveInstallments = async () => {
    if (!details) return;
    setSavingInstallments(true);
    setInstallmentsMsg('');

    try {
      // ao salvar: se não está pago e venceu, manda como overdue (pra ficar persistido)
      const payloadInstallments = editingInstallments.map(it => {
        const paid = it.status === 'paid' || !!it.paid_date;
        const overdue = !paid && isOverdue(it.due_date);
        return {
          number: it.number,
          value: it.value,
          due_date: it.due_date,
          status: paid ? 'paid' : (overdue ? 'overdue' : 'pending'),
          paid_date: paid ? (it.paid_date || todayIso()) : null
        };
      });

      const resp = await fetch(`/api/sales/${details.id}/installments`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ installments: payloadInstallments })
      });

      if (!resp.ok) {
        setInstallmentsMsg('❌ Não foi possível salvar as parcelas. Faça login novamente e tente de novo.');
        return;
      }

      // recarrega tudo e reabre detalhes atualizado (por id)
      await load();
      setInstallmentsMsg('✅ Parcelas salvas.');
      // Atualiza o modal com os dados mais recentes
      setDetails(prev => {
        if (!prev) return prev;
        const updated = sales.find(x => x.id === prev.id);
        return updated || prev;
      });
    } catch (e) {
      setInstallmentsMsg('❌ Erro ao salvar parcelas.');
    } finally {
      setSavingInstallments(false);
    }
  };

return (
  <Shell darkMode={darkMode}>
    <div className="min-h-screen flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-7xl rounded-[2.75rem] border border-white/10 bg-white/5 backdrop-blur-2xl shadow-[0_30px_120px_-40px_rgba(0,0,0,0.8)] overflow-hidden">
        <div className="flex min-h-[86vh]">
          {/* Sidebar */}
          <aside className="w-[92px] lg:w-[280px] shrink-0 border-r border-white/10 bg-black/20">
            <div className="p-5 lg:p-6">
              <div className="flex items-center gap-3">
                <motion.div whileHover={{ rotate: 12, scale: 1.04 }} transition={{ type: 'spring', stiffness: 320, damping: 18 }} className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 shadow-lg shadow-violet-500/35 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </motion.div>
                <div className="hidden lg:block">
                  <div className="text-sm text-white/60">Dashboard</div>
                  <div className="text-lg font-semibold leading-tight">Comissões</div>
                </div>
              </div>
            </div>

            <nav className="px-3 lg:px-4 space-y-1">
              <SideItem active={tab==='overview'} onClick={()=>setTab('overview')} icon={FileText} label="Visão geral" />
              <SideItem active={tab==='sales'} onClick={()=>setTab('sales')} icon={BarChart3} label="Vendas" />
              {isAdmin && <SideItem active={tab==='consultants'} onClick={()=>setTab('consultants')} icon={Users} label="Consultores" />}
              {isAdmin && <SideItem active={tab==='settings'} onClick={()=>setTab('settings')} icon={Settings2} label="Configurações" />}
            </nav>

            <div className="mt-auto p-3 lg:p-4">
              <div className="hidden lg:block text-xs text-white/50 mb-3">
                {isAdmin ? '🛡️ Admin' : `👤 ${consultants.find(c => c.id === user.consultant_id)?.name || 'Consultor'}`}
              </div>

              <div className="grid gap-2">
                <button onClick={downloadExcel} className="w-full flex items-center justify-center lg:justify-start gap-2 px-3 py-2.5 rounded-2xl border border-white/10 hover:bg-white/5 transition">
                  <Download className="w-4 h-4" />
                  <span className="hidden lg:inline">Exportar Excel</span>
                </button>

                <button onClick={() => setDarkMode(v => !v)} className="w-full flex items-center justify-center lg:justify-start gap-2 px-3 py-2.5 rounded-2xl border border-white/10 hover:bg-white/5 transition">
                  {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  <span className="hidden lg:inline">{darkMode ? 'Modo claro' : 'Modo escuro'}</span>
                </button>

                <button onClick={logout} className="w-full flex items-center justify-center lg:justify-start gap-2 px-3 py-2.5 rounded-2xl bg-white text-slate-900 hover:bg-white/90 transition">
                  <LogOut className="w-4 h-4" />
                  <span className="hidden lg:inline">Sair</span>
                </button>
              </div>
            </div>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="sticky top-0 z-30 px-4 lg:px-7 py-5 border-b border-white/10 bg-black/10 backdrop-blur-2xl">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-2xl lg:text-3xl font-semibold tracking-tight">{tab === 'overview' ? 'Visão geral' : tab === 'sales' ? 'Vendas' : tab === 'consultants' ? 'Consultores' : 'Configurações'}</div>
                  <div className="text-sm text-white/60">Gestão de vendas, comissões e parcelas • tudo em um só lugar</div>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={load} className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-white/10 hover:bg-white/5 transition">
                    <RefreshCw className="w-4 h-4" />
                    Atualizar
                  </button>

                  <button onClick={() => { setEditing(null); setSaleFormOpen(true); }} className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25">
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Nova venda</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="px-4 lg:px-7 py-6">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
                transition={{ type: 'spring', stiffness: 260, damping: 26 }}
              >
                {loading ? (
                  <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8">
                    <div className="animate-pulse space-y-3">
                      <div className="h-6 w-52 rounded-2xl bg-white/10" />
                      <div className="h-4 w-80 rounded-2xl bg-white/10" />
                      <div className="h-4 w-64 rounded-2xl bg-white/10" />
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Overview */}
                    {tab === 'overview' && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
                          <Pill icon={FileText} label="Vendas" value={String(kpis.count)} tone="violet" />
                          <Pill icon={BarChart3} label="Comissão total" value={fmtBRL(kpis.total)} tone="cyan" />
                          <Pill icon={KeyRound} label="Pago" value={fmtBRL(kpis.paid)} tone="emerald" />
                          <Pill icon={FileText} label="Pendente" value={fmtBRL(kpis.pending)} tone="amber" />
                          <Pill icon={FileText} label="Atrasado" value={fmtBRL(kpis.overdue)} tone="rose" />
                        </div>

                        <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-4">
                          <div className="xl:col-span-2 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
                            <SectionTitle icon={BarChart3} title="Ranking de consultores" subtitle="Top por comissão total" />
                            <div className="mt-4">
                              <Bar data={chartBar.data} options={chartBar.options} />
                            </div>
                          </div>
                          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
                            <SectionTitle icon={FileText} title="Parcelas" subtitle="Pagas x pendentes x atrasadas" />
                            <div className="mt-4">
                              <Doughnut data={chartDonut.data} options={chartDonut.options} />
                            </div>
                            <div className="mt-5 text-sm text-white/60">
                              Crédito gerado: <span className="text-white font-semibold">{fmtBRL(kpis.credit)}</span>
                            </div>
                          </div>
                        </div>

                        {summary && (
                          <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
                            <SectionTitle icon={FileText} title="Resumo rápido" subtitle="Hoje • últimos 7 dias • mês" />
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                              <KpiMini label="Vendas hoje" value={String(summary.today_sales || 0)} />
                              <KpiMini label="Comissão hoje" value={fmtBRL(summary.today_commission || 0)} />
                              <KpiMini label="Vendas 7 dias" value={String(summary.last7_sales || 0)} />
                              <KpiMini label="Comissão do mês" value={fmtBRL(summary.month_commission || 0)} />
                              <KpiMini label="Parcelas pendentes" value={String(summary.pending_installments || 0)} />
                              <KpiMini label="Parcelas atrasadas" value={String(summary.overdue_installments || 0)} />
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* Sales */}
                    {tab === 'sales' && (
                      <SalesTable
                        sales={sales}
                        isAdmin={isAdmin}
                        onOpen={(s)=>setDetails(s)}
                        onEdit={(s)=>{ setEditing(s); setSaleFormOpen(true); }}
                        onDelete={(s)=>deleteSale(s.id)}
                      />
                    )}

                    {/* Admin: Consultants */}
                    {tab === 'consultants' && isAdmin && (
                      <ConsultantsPanel consultants={consultants} onReload={load} />
                    )}

                    {/* Admin: Settings */}
                    {tab === 'settings' && isAdmin && (
                      <SettingsPanel onReload={load} />
                    )}
                  </>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <SaleForm
      open={saleFormOpen}
      onClose={()=>{ setSaleFormOpen(false); setEditing(null); }}
      onSave={saveSale}
      consultants={consultants}
      user={user}
      editing={editing}
    />

    <DetailsModal
      open={!!details}
      sale={details}
      onClose={()=>setDetails(null)}
      isAdmin={isAdmin}
      onEdit={()=>{ setEditing(details); setSaleFormOpen(true); }}
      onDelete={()=>details && deleteSale(details.id)}
      editingInstallments={editingInstallments}
      setInstallmentUiStatus={setInstallmentUiStatus}
      saveInstallments={saveInstallments}
      savingInstallments={savingInstallments}
      installmentsMsg={installmentsMsg}
    />
  </Shell>
);

}

function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl border transition ${active
        ? 'border-violet-400/40 bg-violet-500/10 text-violet-200 dark:text-violet-200'
        : 'border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}


function SideItem({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`sideItem ${active ? 'active' : ''}`}
    >
      <div className="sideDot" />
      <Icon className="w-5 h-5" />
      <span className="hidden lg:inline">{label}</span>
    </button>
  );
}

function KpiMini({ label, value }) {
  return (
    <div className="glass-card p-5">
      <div className="text-xs uppercase tracking-wide text-white/55">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="rounded-3xl border border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-white/5 p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</div>
      <div className="mt-1 font-semibold text-slate-900 dark:text-white">{value || '—'}</div>
    </div>
  );
}

function SalesView({ sales, isAdmin, onNew, onDetails }) {
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return sales;
    return sales.filter(x =>
      String(x.client_name || '').toLowerCase().includes(s) ||
      String(x.consultant_name || '').toLowerCase().includes(s) ||
      String(x.product || '').toLowerCase().includes(s)
    );
  }, [q, sales]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <div className="text-xl font-semibold">Vendas</div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Clique em uma linha para ver detalhes.</div>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={q}
            onChange={(e)=>setQ(e.target.value)}
            placeholder="Buscar por cliente, consultor ou produto…"
            className="w-72 max-w-full rounded-2xl bg-white/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
          />
          <button onClick={onNew} className="px-4 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold shadow-lg shadow-violet-600/20 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nova venda
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300">
              <tr>
                <th className="text-left px-4 py-3">Data</th>
                <th className="text-left px-4 py-3">Cliente</th>
                {isAdmin && <th className="text-left px-4 py-3">Consultor</th>}
                <th className="text-left px-4 py-3">Produto</th>
                <th className="text-right px-4 py-3">Base</th>
                <th className="text-right px-4 py-3">Comissão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-white/10">
              {filtered.map(s => (
                <tr
                  key={s.id}
                  onClick={() => onDetails(s)}
                  className="cursor-pointer hover:bg-slate-100/70 dark:hover:bg-white/5"
                >
                  <td className="px-4 py-3 whitespace-nowrap">{fmtDate(s.sale_date)}</td>
                  <td className="px-4 py-3">{s.client_name}</td>
                  {isAdmin && <td className="px-4 py-3">{s.consultant_name}</td>}
                  <td className="px-4 py-3">{s.product}</td>
                  <td className="px-4 py-3 text-right font-medium">{fmtBRL(s.base_value)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{fmtBRL(s.total_commission)}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={isAdmin ? 6 : 5} className="px-4 py-10 text-center text-slate-500 dark:text-slate-400">Nenhuma venda encontrada.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ConsultantsView({ consultants, onReload }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  const add = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await api.createConsultant({ name, email, active: true });
      setName('');
      setEmail('');
      await onReload();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionTitle icon={Users} title="Consultores" subtitle="Cadastre e mantenha sua equipe organizada." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-3xl border border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-white/5 p-6 shadow-xl">
          <div className="font-semibold mb-4">Novo consultor</div>
          <form onSubmit={add} className="space-y-4">
            <TextInput label="Nome" required value={name} onChange={setName} />
            <TextInput label="Email" value={email} onChange={setEmail} />
            <button disabled={saving} className="w-full px-5 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold shadow-lg shadow-violet-600/20 disabled:opacity-60">
              {saving ? 'Salvando…' : 'Adicionar'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 rounded-3xl border border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-white/5 shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200/60 dark:border-white/10 font-semibold">Lista</div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="text-left px-4 py-3">Nome</th>
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-left px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 dark:divide-white/10">
                {consultants.map(c => (
                  <tr key={c.id} className="hover:bg-slate-100/70 dark:hover:bg-white/5">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3">{c.email || '—'}</td>
                    <td className="px-4 py-3">
                      {c.active ? <span className="text-xs px-3 py-1 rounded-full border bg-emerald-500/15 text-emerald-200 border-emerald-400/20">Ativo</span>
                        : <span className="text-xs px-3 py-1 rounded-full border bg-slate-500/10 text-slate-400 border-white/10">Inativo</span>}
                    </td>
                  </tr>
                ))}
                {consultants.length === 0 && (
                  <tr><td colSpan={3} className="px-4 py-10 text-center text-slate-500 dark:text-slate-400">Nenhum consultor cadastrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsView({ consultants, onReload }) {
  const [selected, setSelected] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const createLogin = async (e) => {
    e.preventDefault();
    setMsg('');
    if (!selected || !username || !password) return;
    setLoading(true);
    try {
      await api.createConsultantLogin(Number(selected), { username, password });
      setMsg('✅ Login criado/atualizado com sucesso.');
      setUsername('');
      setPassword('');
      await onReload();
    } catch (err) {
      setMsg(err.payload?.error === 'username_taken' ? '❌ Usuário já existe.' : '❌ Não foi possível criar o login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionTitle icon={KeyRound} title="Configurações" subtitle="Crie logins para consultores (acesso restrito)." />

      <div className="rounded-3xl border border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-white/5 p-6 shadow-xl max-w-3xl">
        <form onSubmit={createLogin} className="space-y-4">
          <SelectInput
            label="Consultor"
            required
            value={selected}
            onChange={setSelected}
            options={consultants.map(c => ({ value: String(c.id), label: c.name }))}
          />
          <TextInput label="Usuário" required value={username} onChange={setUsername} placeholder="Ex: pedro" />
          <TextInput label="Senha" required value={password} onChange={setPassword} type="password" />

          {msg && (
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-3 text-sm">
              {msg}
            </div>
          )}

          <button disabled={loading} className="px-5 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold shadow-lg shadow-violet-600/20 disabled:opacity-60">
            {loading ? 'Salvando…' : 'Criar login'}
          </button>

          <div className="text-xs text-slate-600 dark:text-slate-300">
            Depois, o consultor entra pela tela de login com seu usuário/senha.
          </div>
        </form>
      </div>
    </div>
  );
}
