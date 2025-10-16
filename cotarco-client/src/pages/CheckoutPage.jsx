import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useCart } from '../contexts/CartContext.jsx';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AnimatePresence, motion as M } from 'framer-motion';
import { Clipboard, Landmark, LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import api from '../services/api';
import CotarcoLogo from '@/assets/logo-cotarco.png';
import { Link } from 'react-router-dom';

export default function CheckoutPage() {
  const { user } = useAuth();
  const { items, subtotal, clearCart } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [paymentData, setPaymentData] = useState(null);

  const formatCurrency = (value) => (Number(value) || 0).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });

  const defaultValues = useMemo(() => ({
    fullName: user?.name || '',
    companyName: user?.partner_profile?.company_name || '',
    shippingAddress: '',
    city: '',
    phoneNumber: ''
  }), [user]);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues
  });

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${fieldName} copiado com sucesso!`);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      toast.error('Falha ao copiar.');
    });
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    const payload = {
      details: data,
      items: items,
    };
    try {
      const response = await api.post('/orders/create-payment', payload);
      if (response?.data?.entity && response?.data?.reference) {
        setPaymentData(response.data);
        clearCart();
        return;
      }

      // Se a API retornar 202 com merchantTransactionId, iniciar polling até o webhook preencher a referência
      if (response?.status === 202 && response?.data?.merchantTransactionId) {
        const tx = response.data.merchantTransactionId;
        const start = Date.now();
        const timeoutMs = 60000; // 60s
        const pollIntervalMs = 3000; // 3s

        const poll = async () => {
          try {
            const refRes = await api.get(`/orders/payment-reference/${tx}`);
            if (refRes?.data?.entity && refRes?.data?.reference) {
              setPaymentData({ ...refRes.data });
              clearCart();
              return true;
            }
          } catch (e) {
            // Se 202, continuar a tentar; outros erros mostram toast e param
            if (e?.response?.status && e.response.status !== 202) {
              toast.error(e?.response?.data?.message || 'Erro ao consultar referência.');
              return true;
            }
          }
          return false;
        };

        const loop = async () => {
          while (Date.now() - start < timeoutMs) {
            const done = await poll();
            if (done) return;
            await new Promise(r => setTimeout(r, pollIntervalMs));
          }
          toast.error('Tempo de espera excedido ao obter a referência. Tente novamente.');
        };

        await loop();
        return;
      }

      console.error('Resposta inesperada da API:', response?.data);
      toast.error('Não foi possível iniciar o pagamento. Tente novamente.');
    } catch (error) {
      console.error('Erro ao criar pagamento:', error);
      toast.error(error?.response?.data?.message || 'Erro ao criar pagamento.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/dashboard" aria-label="Voltar para a página inicial de parceiros">
          <img src={CotarcoLogo} alt="COTARCO" className="h-10 w-auto cursor-pointer" />
        </Link>
      </div>
      <h1 className="text-2xl font-semibold mb-6">Checkout</h1>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-7 lg:col-span-8">
          <AnimatePresence mode="wait">
            {!paymentData ? (
              <M.div
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="bg-white rounded-md border p-6">
                    <h2 className="text-lg font-medium mb-4">Dados para Envio</h2>
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="fullName">Nome Completo</Label>
                          <Input id="fullName" readOnly defaultValue={defaultValues.fullName} />
                        </div>
                        <div>
                          <Label htmlFor="companyName">Nome da Empresa</Label>
                          <Input id="companyName" readOnly defaultValue={defaultValues.companyName} />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="shippingAddress">Endereço</Label>
                        <Input id="shippingAddress" placeholder="Rua, número, bairro" aria-invalid={errors.shippingAddress ? 'true' : 'false'} {...register('shippingAddress', { required: true })} />
                        {errors.shippingAddress && <p className="text-sm text-red-600 mt-1">O endereço é obrigatório.</p>}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="city">Cidade</Label>
                          <Input id="city" placeholder="Cidade" aria-invalid={errors.city ? 'true' : 'false'} {...register('city', { required: true })} />
                          {errors.city && <p className="text-sm text-red-600 mt-1">A cidade é obrigatória.</p>}
                        </div>
                        <div>
                          <Label htmlFor="phoneNumber">Telefone</Label>
                          <Input id="phoneNumber" placeholder="Telefone" aria-invalid={errors.phoneNumber ? 'true' : 'false'} {...register('phoneNumber', { required: true })} />
                          {errors.phoneNumber && <p className="text-sm text-red-600 mt-1">O telefone é obrigatório.</p>}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-md border p-6">
                     <h2 className="text-lg font-medium mb-4">Pagamento</h2>
                     <RadioGroup defaultValue="reference" className="gap-4">
                        <div>
                          
                           <Label htmlFor="ref" className="flex flex-row items-center justify-start gap-x-4 rounded-md border-1 p-4 hover:bg-accent hover:text-accent-foreground  [&:has([data-state=checked])]:border-gray-200 custom-radio bg-gray-50">
                           <RadioGroupItem value="reference" id="ref" className="my-bg-red my-stroke-red" />
                              <span>Pagamento Por Referência</span>
                           
                           </Label>
                        </div>
                     </RadioGroup>
                  </div>
                  
                  <Button type="submit" disabled={isLoading} className="w-full text-base my-bg-red py-6">
                    {isLoading ? <LoaderCircle className="animate-spin" /> : 'Finalizar Encomenda'}
                  </Button>
                </form>
              </M.div>
            ) : (
              <M.div
                key="payment-details"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <Alert>
                  <AlertTitle className="text-xl font-bold">Pagamento Gerado com Sucesso!</AlertTitle>
                  <AlertDescription className="mt-4 space-y-4">
                    <p>Utilize os dados abaixo para efetuar o pagamento. A sua encomenda será processada após a confirmação.</p>
                    <div className="border rounded-md p-4 space-y-3 bg-muted/50">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-sm text-gray-600">Entidade</span>
                          <p className="font-mono text-lg font-semibold">{paymentData.entity}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => copyToClipboard(paymentData.entity, 'Entidade')}>
                          <Clipboard className="h-5 w-5" />
                        </Button>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-sm text-gray-600">Referência</span>
                          <p className="font-mono text-lg font-semibold">{paymentData.reference}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => copyToClipboard(paymentData.reference, 'Referência')}>
                          <Clipboard className="h-5 w-5" />
                        </Button>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-sm text-gray-600">Valor</span>
                          <p className="font-mono text-lg font-semibold">{formatCurrency(paymentData.amount)}</p>
                        </div>
                         <Button variant="ghost" size="icon" onClick={() => copyToClipboard(paymentData.amount, 'Valor')}>
                          <Clipboard className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              </M.div>
            )}
          </AnimatePresence>
        </div>

        <div className="md:col-span-5 lg:col-span-4 bg-white rounded-md border p-6 h-fit">
          <h2 className="text-lg font-medium mb-4">Resumo da Encomenda</h2>
          <div className="space-y-4 max-h-[60vh] overflow-auto pr-2">
            {items.length === 0 && !paymentData ? (
              <p className="text-sm text-gray-600">O seu carrinho está vazio.</p>
            ) : items.length === 0 && paymentData ? (
               <p className="text-sm text-gray-600">Carrinho finalizado.</p>
            ) : (
              items.map((it) => (
                <div key={it.id} className="flex items-center gap-3 border-b pb-3">
                  <img src={it.images?.[0]?.src || it.image || ''} alt={it.name} className="h-14 w-14 object-cover rounded" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{it.name}</p>
                    <p className="text-sm text-gray-600">{formatCurrency(it.price)} x {it.quantity}</p>
                  </div>
                  <div className="text-right font-medium">{formatCurrency((Number(it.price) || 0) * (Number(it.quantity) || 0))}</div>
                </div>
              ))
            )}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-gray-600">Subtotal</span>
            <span className="font-semibold">{formatCurrency(subtotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
