import React from 'react';
import Skeleton from 'react-loading-skeleton';
import { CreditCard, Copy, Calendar, ExternalLink, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

/* ─────────────────────────────────────────────────────────────────────────────
 * Cotarco brand palette (derived from primary #f22f1d)
 *
 * 60% → Deep charcoal-red base  (#1a0a08 → #2d1210)  — background gradient
 * 30% → Warm-tinted surfaces    (rgba red-tinted whites) — inner rows
 * 10% → Brand crimson accent    (#f22f1d)              — badge, hover ring
 *
 * Text on dark:  pure white for primary / rgba(255,255,255,0.60) for labels
 * Never pure #000 / never pure gray — always brand-tinted per guidelines
 * ───────────────────────────────────────────────────────────────────────────── */

const ActivePaymentReference = ({ stats, isLoading }) => {
  if (isLoading || !stats) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <Skeleton height={24} width={150} className="mb-4" />
        <Skeleton height={100} />
      </div>
    );
  }

  const { active_payment } = stats;

  if (!active_payment) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-full">
        <div className="flex items-center space-x-2 mb-4 text-slate-800">
          <CreditCard className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold">Pagamento Pendente</h3>
        </div>
        <div className="flex items-center justify-center text-slate-500 py-6">
          Sem referências activas
        </div>
      </div>
    );
  }

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${type} copiada com sucesso!`);
    }).catch(() => {
      toast.error('Erro ao copiar.');
    });
  };

  return (
    <div
      className="rounded-xl shadow-lg text-white p-6 relative overflow-hidden h-full"
      style={{
        /* 60% — Deep charcoal-red gradient (brand-tinted, never pure black) */
        background: 'linear-gradient(135deg, #1c0b09 0%, #2e1210 45%, #3d1714 100%)',
      }}
    >
      {/* ── Decorative background elements ── */}

      {/* Large soft glow — brand crimson, top-right */}
      <div
        className="absolute -top-10 -right-10 w-48 h-48 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(242,47,29,0.18) 0%, transparent 70%)',
        }}
      />

      {/* Subtle bottom-left glow for depth */}
      <div
        className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(242,47,29,0.10) 0%, transparent 70%)',
        }}
      />

      {/* Thin top accent line — brand red */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5 pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, #f22f1d 50%, transparent)' }}
      />

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-2">
          {/* Icon badge */}
          <span
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            style={{ background: 'rgba(242,47,29,0.20)', border: '1px solid rgba(242,47,29,0.35)' }}
          >
            <CreditCard className="w-4 h-4" style={{ color: '#f77066' }} />
          </span>
          <h3 className="text-base font-semibold tracking-tight text-white">
            Pagamento Pendente
          </h3>
        </div>

        {/* Multicaixa badge — brand-red tinted */}
        <div
          className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold tracking-wide"
          style={{
            background: 'rgba(242,47,29,0.18)',
            border: '1px solid rgba(242,47,29,0.40)',
            color: '#fca49e',
          }}
        >
          <ShieldCheck className="w-3 h-3" />
          Multicaixa
        </div>
      </div>

      {/* ── Data rows ── */}
      <div className="space-y-3 relative z-10">

        {/* Entidade */}
        <div
          className="rounded-lg p-3 flex justify-between items-center"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div>
            <p
              className="text-xs mb-1 uppercase tracking-widest font-medium"
              style={{ color: 'rgba(255,255,255,0.50)' }}
            >
              Entidade
            </p>
            <p
              className="font-mono text-xl font-semibold tracking-widest text-white"
              data-testid="payment-entity"
            >
              {active_payment.entity || 'N/A'}
            </p>
          </div>
          <button
            onClick={() => handleCopy(active_payment.entity, 'Entidade')}
            className="p-2 rounded-full transition-all duration-200 group"
            style={{ background: 'rgba(255,255,255,0.06)' }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(242,47,29,0.25)';
              e.currentTarget.style.boxShadow = '0 0 0 1px rgba(242,47,29,0.50)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            title="Copiar entidade"
          >
            <Copy className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.55)' }} />
            <span className="sr-only">Copiar entidade</span>
          </button>
        </div>

        {/* Referência */}
        <div
          className="rounded-lg p-3 flex justify-between items-center"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div>
            <p
              className="text-xs mb-1 uppercase tracking-widest font-medium"
              style={{ color: 'rgba(255,255,255,0.50)' }}
            >
              Referência
            </p>
            <p
              className="font-mono text-xl font-semibold tracking-widest text-white"
              data-testid="payment-reference"
            >
              {active_payment.reference_number || 'N/A'}
            </p>
          </div>
          <button
            onClick={() => handleCopy(active_payment.reference_number, 'Referência')}
            className="p-2 rounded-full transition-all duration-200"
            style={{ background: 'rgba(255,255,255,0.06)' }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(242,47,29,0.25)';
              e.currentTarget.style.boxShadow = '0 0 0 1px rgba(242,47,29,0.50)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            title="Copiar referência"
          >
            <Copy className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.55)' }} />
            <span className="sr-only">Copiar referência</span>
          </button>
        </div>

        {/* Montante + Data */}
        <div className="flex justify-between items-end pt-1">
          <div>
            <p
              className="text-xs mb-1 uppercase tracking-widest font-medium"
              style={{ color: 'rgba(255,255,255,0.50)' }}
            >
              Montante
            </p>
            <p className="text-2xl font-bold text-white">
              {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(active_payment.amount)}
            </p>
          </div>

          {active_payment.due_date && (
            <div className="text-right">
              <p
                className="text-xs mb-1 flex items-center justify-end gap-1 uppercase tracking-widest font-medium"
                style={{ color: 'rgba(255,255,255,0.50)' }}
              >
                <Calendar className="w-3 h-3" /> Expira a
              </p>
              <p className="text-sm font-semibold text-white">
                {new Date(active_payment.due_date).toLocaleDateString('pt-AO')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── CTA link ── */}
      <a
        href={`/orders/${active_payment.order_id}`}
        className="mt-5 flex items-center justify-center w-full py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 relative z-10"
        style={{
          background: 'rgba(242,47,29,0.15)',
          border: '1px solid rgba(242,47,29,0.35)',
          color: '#fca49e',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(242,47,29,0.28)';
          e.currentTarget.style.borderColor = 'rgba(242,47,29,0.60)';
          e.currentTarget.style.color = '#ffffff';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(242,47,29,0.15)';
          e.currentTarget.style.borderColor = 'rgba(242,47,29,0.35)';
          e.currentTarget.style.color = '#fca49e';
        }}
      >
        Ver Encomenda <ExternalLink className="w-3.5 h-3.5 ml-2" />
      </a>
    </div>
  );
};

export default ActivePaymentReference;
