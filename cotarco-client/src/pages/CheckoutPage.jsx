import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useCart } from '../contexts/CartContext.jsx';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '../services/api';

export default function CheckoutPage() {
  const { user } = useAuth();
  const { items, subtotal } = useCart();

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
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (data) => {
    setIsLoading(true);
    const payload = {
      details: data,
      items: items,
    };
    try {
      const response = await api.post('/orders/create-payment', payload);
      if (response?.data?.payment_url) {
        window.location.href = response.data.payment_url;
      } else {
        console.error('Resposta inesperada da API:', response?.data);
        alert('Não foi possível iniciar o pagamento. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao criar pagamento:', error);
      alert(error?.response?.data?.message || 'Erro ao criar pagamento.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Checkout</h1>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left column: form */}
        <div className="md:col-span-7 lg:col-span-8 bg-white rounded-md border p-6">
          <h2 className="text-lg font-medium mb-4">Dados para Envio</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
              {errors.shippingAddress && (
                <p className="text-sm text-red-600 mt-1">O endereço é obrigatório.</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">Cidade</Label>
                <Input id="city" placeholder="Cidade" aria-invalid={errors.city ? 'true' : 'false'} {...register('city', { required: true })} />
                {errors.city && (
                  <p className="text-sm text-red-600 mt-1">A cidade é obrigatória.</p>
                )}
              </div>
              <div>
                <Label htmlFor="phoneNumber">Telefone</Label>
                <Input id="phoneNumber" placeholder="Telefone" aria-invalid={errors.phoneNumber ? 'true' : 'false'} {...register('phoneNumber', { required: true })} />
                {errors.phoneNumber && (
                  <p className="text-sm text-red-600 mt-1">O telefone é obrigatório.</p>
                )}
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="w-full md:w-auto inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90">
              {isLoading ? 'A processar...' : 'Finalizar Encomenda'}
            </button>
          </form>
        </div>

        {/* Right column: order summary */}
        <div className="md:col-span-5 lg:col-span-4 bg-white rounded-md border p-6 h-fit">
          <h2 className="text-lg font-medium mb-4">Resumo da Encomenda</h2>
          <div className="space-y-4 max-h-[60vh] overflow-auto pr-2">
            {items.length === 0 ? (
              <p className="text-sm text-gray-600">O seu carrinho está vazio.</p>
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


