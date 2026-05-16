import { useState, useEffect } from 'react';
import { AlertTriangle, Clock, SendHorizonal, Eye, RefreshCw, CheckCircle, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const SendMessageModal = ({ customer, onClose, onSent }) => {
  const [content, setContent] = useState(`Dear ${customer.name}, we miss you! It's been a while since your last visit. Come back and enjoy exclusive offers just for you. 🎁`);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSend = async () => {
    setLoading(true);
    try {
      await api.post('/messages/send', {
        customerId: customer._id,
        content,
        subject: 'We miss you! Exclusive Win-Back Offer'
      });
      setSuccess(true);
      setTimeout(() => { onSent(); onClose(); }, 1500);
    } catch (e) {} finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="glass w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex justify-between items-center p-5 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>Send Win-Back Message</h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>
        <div className="p-5 flex flex-col gap-4">
          {success ? (
            <div className="flex flex-col items-center py-6 gap-3">
              <CheckCircle size={44} className="text-emerald-400" />
              <p className="font-bold" style={{ color: 'var(--text-primary)' }}>Message sent!</p>
            </div>
          ) : (
            <>
              <div className="p-3 rounded-xl text-sm font-medium border" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-color)' }}>
                <p className="text-xs uppercase tracking-wide mb-1 font-bold" style={{ color: 'var(--text-muted)' }}>To</p>
                <p style={{ color: 'var(--text-primary)' }}>{customer.name} · {customer.phone}</p>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>Message</label>
                <textarea className="input-field resize-none h-32" value={content} onChange={e => setContent(e.target.value)} />
              </div>
              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold hover:bg-white/5 transition-colors border" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}>Cancel</button>
                <button onClick={handleSend} disabled={loading}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-crm-teal to-crm-cyan text-crm-darker hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                  <SendHorizonal size={15} /> {loading ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const Retention = () => {
  const [inactiveCustomers, setInactiveCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [targetCustomer, setTargetCustomer] = useState(null);
  const [monthlySending, setMonthlySending] = useState(false);
  const [monthlyResult, setMonthlyResult] = useState(null);

  const fetchInactive = async () => {
    setLoading(true);
    try { const { data } = await api.get('/customers/inactive'); setInactiveCustomers(data); }
    catch (e) {} finally { setLoading(false); }
  };

  useEffect(() => { fetchInactive(); }, []);

  const daysSince = (date) => Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));

  const handleSendMonthly = async () => {
    setMonthlySending(true);
    try {
      const { data } = await api.post('/messages/send-monthly');
      setMonthlyResult(data);
    } catch (e) {} finally { setMonthlySending(false); }
  };

  return (
    <div className="page-container">
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Customer <span className="bg-gradient-to-r from-red-400 to-crm-accent bg-clip-text text-transparent">Retention</span>
          </h1>
          <p className="mt-1 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Detect and re-engage customers who haven't visited in 60+ days
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button onClick={fetchInactive} className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border hover:bg-white/5 transition-colors"
            style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}>
            <RefreshCw size={15} /> Refresh
          </button>
          <button onClick={handleSendMonthly} disabled={monthlySending}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-crm-accent to-crm-cyan text-white text-sm font-bold rounded-xl hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all shadow-lg">
            <SendHorizonal size={15} /> {monthlySending ? 'Sending...' : 'Send Monthly Messages'}
          </button>
        </div>
      </div>

      {/* Monthly result banner */}
      {monthlyResult && (
        <div className="mb-6 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle size={20} className="text-emerald-400" />
            <p className="font-bold text-emerald-300">{monthlyResult.message}</p>
          </div>
          <button onClick={() => setMonthlyResult(null)} className="text-emerald-400/60 hover:text-emerald-400"><X size={16} /></button>
        </div>
      )}

      {/* Alert Banner */}
      {!loading && inactiveCustomers.length > 0 && (
        <div className="mb-6 p-5 rounded-xl border border-red-500/30 bg-red-500/10 flex items-start gap-4 animate-fade-in">
          <AlertTriangle size={24} className="text-red-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-red-300 mb-1">{inactiveCustomers.length} customers need re-engagement!</h3>
            <p className="text-sm text-red-400/80">These customers haven't visited in 60+ days. Send win-back offers to bring them back.</p>
          </div>
        </div>
      )}

      {/* Inactive Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Inactive (60+ days)', val: inactiveCustomers.length, color: 'text-red-400', bg: 'bg-red-500/10' },
          { label: 'Avg Days Since Visit', val: inactiveCustomers.length > 0 ? Math.round(inactiveCustomers.reduce((s, c) => s + daysSince(c.lastVisitDate), 0) / inactiveCustomers.length) : '—', color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'At Risk Revenue', val: `₹${inactiveCustomers.reduce((s, c) => s + (c.totalSpending || 0), 0).toLocaleString()}`, color: 'text-orange-400', bg: 'bg-orange-500/10' },
          { label: 'Total Unused Points', val: inactiveCustomers.reduce((s, c) => s + (c.rewardPoints || 0), 0).toLocaleString(), color: 'text-purple-400', bg: 'bg-purple-500/10' },
        ].map((s, i) => (
          <div key={i} className={`p-4 rounded-xl border ${s.bg} flex flex-col gap-1`} style={{ borderColor: 'var(--border-color)' }}>
            <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            <p className={`text-2xl font-extrabold ${s.color}`}>{loading ? '...' : s.val}</p>
          </div>
        ))}
      </div>

      {/* Inactive Customers Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-elevated)' }}>
          <h2 className="font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Clock size={16} className="text-red-400" />
            Inactive Customers
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--bg-elevated)' }}>
                {['Customer', 'Phone', 'Spending', 'Last Visit', 'Days Inactive', 'Points', 'Action'].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-bold uppercase text-left" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="py-10 text-center animate-pulse text-crm-teal font-semibold">Loading...</td></tr>
              ) : inactiveCustomers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center">
                    <CheckCircle size={36} className="mx-auto mb-3 text-emerald-400 opacity-60" />
                    <p className="font-bold" style={{ color: 'var(--text-primary)' }}>Great! No inactive customers</p>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>All customers visited within 60 days</p>
                  </td>
                </tr>
              ) : inactiveCustomers.map(c => {
                const days = daysSince(c.lastVisitDate);
                return (
                  <tr key={c._id} className="border-t hover:bg-white/[0.02]" style={{ borderColor: 'var(--border-color)' }}>
                    <td className="px-4 py-3 font-semibold" style={{ color: 'var(--text-primary)' }}>{c.name}</td>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{c.phone}</td>
                    <td className="px-4 py-3 font-bold text-emerald-400">₹{c.totalSpending?.toLocaleString() || 0}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {new Date(c.lastVisitDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${days > 120 ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        {days}d ago
                      </span>
                    </td>
                    <td className="px-4 py-3 text-amber-400 font-bold">{c.rewardPoints || 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setTargetCustomer(c)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-crm-accent/10 text-crm-accent border border-crm-accent/25 rounded-lg hover:bg-crm-accent/20 transition-colors">
                          <SendHorizonal size={12} /> Send Offer
                        </button>
                        <Link to={`/customers/${c._id}`} className="p-1.5 rounded-lg border hover:bg-white/5 transition-colors"
                          style={{ color: 'var(--text-muted)', borderColor: 'var(--border-color)' }}>
                          <Eye size={13} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {targetCustomer && (
        <SendMessageModal customer={targetCustomer} onClose={() => setTargetCustomer(null)} onSent={fetchInactive} />
      )}
    </div>
  );
};

export default Retention;
