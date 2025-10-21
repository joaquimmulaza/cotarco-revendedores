import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/services/api';
import { config } from '@/config/config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, User, Mail, Phone, Home, Hash, Calendar, CreditCard, AlertCircle, Download, Loader2 } from 'lucide-react';

// Função para buscar os detalhes da encomenda
const fetchOrderDetail = async (orderId) => {
  const { data } = await api.get(`/admin/orders/${orderId}`);
  return data;
};

// Componente para o estado de carregamento (Skeleton)
const OrderDetailSkeleton = () => (
  <div className="space-y-6 w-full">
    <Skeleton className="h-8 w-1/4" />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
    <Skeleton className="h-8 w-1/3" />
    <Skeleton className="h-64 w-full" />
  </div>
);

export const OrderDetailPage = () => {
  const { orderId } = useParams();
  const [isDownloading, setIsDownloading] = useState(false);

  const { data: order, error, isLoading, isError } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => fetchOrderDetail(orderId),
  });

  if (isLoading) {
    return <OrderDetailSkeleton />;
  }

  if (isError) {
    return (
        <Alert variant="destructive" className="max-w-2xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro ao carregar encomenda</AlertTitle>
            <AlertDescription>
                Não foi possível obter os detalhes da encomenda. Por favor, tenta novamente mais tarde. Erro: {error.message}
            </AlertDescription>
        </Alert>
    );
  }
  
  // Extrai os dados para facilitar o acesso
  const user = order?.user;
  const profile = user?.partner_profile;
  const address = order?.shipping_details;
  const items = order?.items || [];

  const handleDownloadInvoice = async () => {
    const token = localStorage.getItem(config.AUTH.TOKEN_KEY);
    if (!token) {
      toast.error("Sessão inválida. Por favor, faça login novamente.");
      return;
    }

    setIsDownloading(true);
    const toastId = toast.loading("A iniciar o download da fatura...");

    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const invoiceUrl = `${apiUrl}/api/admin/orders/${orderId}/invoice`;

      const response = await fetch(invoiceUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('A resposta da rede não foi bem-sucedida');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `fatura-${order.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Fatura descarregada com sucesso!", { id: toastId });

    } catch (error) {
      console.error('Error downloading the invoice:', error);
      toast.error("Ocorreu um erro ao descarregar a fatura.", { id: toastId });
    } finally {
      setIsDownloading(false);
    }
  };

  const getPaymentStatusBadge = (status) => {
    const lowerCaseStatus = status?.toLowerCase();
    switch (lowerCaseStatus) {
        case 'paid':
        case 'success':
            return <Badge variant="success">Pago</Badge>;
        case 'pending':
            return <Badge variant="secondary">Pendente</Badge>;
        case 'failed':
            return <Badge variant="destructive">Falhou</Badge>;
        default:
            return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto space-y-6 w-full">
      <div className="flex items-center gap-4 w-full">
        <Link to="/admin/dashboard/orders" className="p-2 rounded-md hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Detalhes da Encomenda <span className="text-muted-foreground">#{order.id.substring(0, 8)}</span>
        </h1>
        <Button 
            onClick={handleDownloadInvoice} 
            variant="outline" 
            size="sm" 
            className="ml-auto flex items-center gap-2 my-bg-red text-white cursor-pointer"
            disabled={isDownloading}
        >
            {isDownloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <Download className="h-4 w-4 " />
            )}
            {isDownloading ? 'Aguarde...' : 'Baixar Fatura'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        {/* Detalhes da Encomenda */}
        <Card className="lg:col-span-1 w-full">
          <CardHeader>
            <CardTitle>Resumo da Encomenda</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2"><Calendar className="h-4 w-4" /> Data</span>
                <span>{new Date(order.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2"><CreditCard className="h-4 w-4" /> Pagamento</span>
                {getPaymentStatusBadge(order.status)}
            </div>
            {order.status === 'paid' && order.paid_at && (
                 <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-2"><Calendar className="h-4 w-4" /> Data Pag.</span>
                    <span>{new Date(order.paid_at).toLocaleDateString()}</span>
                </div>
            )}
            <div className="flex items-center justify-between font-semibold text-base pt-2 border-t">
                <span>Total</span>
                <span>{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(order.total_amount)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Detalhes do Cliente */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
                <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <span>{user?.name} ({profile?.company_name || 'N/A'})</span>
            </div>
            <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <span>{user?.email}</span>
            </div>
            <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <span>{profile?.phone_number || 'N/A'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Morada de Entrega */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Morada de Entrega</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
                <Home className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <p className="whitespace-pre-line">
                    {`${address?.shippingAddress || ''}, ${address?.city || ''}`}
                </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Itens da Encomenda */}
      <Card>
        <CardHeader>
          <CardTitle>Itens da Encomenda</CardTitle>
          <CardDescription>{items.length} item(s) nesta encomenda.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px] hidden sm:table-cell">Imagem</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead className="text-center">Quantidade</TableHead>
                <TableHead className="text-right">Preço Unit.</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="hidden sm:table-cell">
                    <img
                      alt={item.name}
                      className="aspect-square rounded-md object-cover"
                      height="64"
                      src={item.image_url || '/placeholder.svg'} // Idealmente, a API deve retornar a imagem
                      width="64"
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {item.name}
                    <div className="text-xs text-muted-foreground">REF: {item.product_sku || 'N/A'}</div>
                  </TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-right">{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(item.price)}</TableCell>
                  <TableCell className="text-right">{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(item.quantity * item.price)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
