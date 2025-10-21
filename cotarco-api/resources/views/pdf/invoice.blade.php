<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Fatura-Proforma #{{ $order->id }}</title>
    <style>
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            color: #333;
            font-size: 12px;
            line-height: 1.4;
        }
        .container {
            width: 100%;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            display: table;
            width: 100%;
            border-bottom: 1px solid #eee;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header .logo {
            display: table-cell;
            width: 150px;
            vertical-align: top;
        }
        .header .logo img {
            max-width: 150px;
        }
        .header .company-details {
            display: table-cell;
            text-align: right;
            vertical-align: top;
        }
        .invoice-details {
            display: table;
            width: 100%;
            margin-bottom: 30px;
        }
        .invoice-details .client-details,
        .invoice-details .invoice-info {
            display: table-cell;
            width: 50%;
            vertical-align: top;
        }
        .invoice-details .invoice-info {
            text-align: right;
        }
        h1, h2, h3 {
            margin: 0;
            font-weight: bold;
        }
        h1 {
            font-size: 24px;
            color: #000;
            margin-bottom: 10px;
        }
        h2 {
            font-size: 16px;
            margin-bottom: 5px;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        .items-table th,
        .items-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        .items-table th {
            background-color: #f9f9f9;
            font-weight: bold;
        }
        .items-table .text-center {
            text-align: center;
        }
        .items-table .text-right {
            text-align: right;
        }
        .totals {
            width: 100%;
            text-align: right;
        }
        .totals table {
            width: 50%;
            margin-left: auto;
            border-collapse: collapse;
        }
        .totals td {
            padding: 8px;
        }
        .totals .total-label {
            font-weight: bold;
        }
        .totals .grand-total {
            font-size: 18px;
            font-weight: bold;
            border-top: 2px solid #333;
            border-bottom: 2px solid #333;
        }
        .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 10px;
            color: #777;
        }
    </style>
</head>
<body>
    @php
        $logoPath = public_path('logo-cotarco.png');
        $logoData = base64_encode(file_get_contents($logoPath));
        $logoSrc = 'data:image/png;base64,' . $logoData;

        function translateStatus($status) {
            $lowerStatus = strtolower($status);
            switch ($lowerStatus) {
                case 'paid':
                case 'success':
                    return 'Pago';
                case 'pending':
                    return 'Pendente';
                case 'failed':
                    return 'Falhou';
                default:
                    return ucfirst($status);
            }
        }
    @endphp
    <div class="container">
        <div class="header">
            <div class="logo">
                <img src="{{ $logoSrc }}" alt="Logotipo Cotarco">
            </div>
            <div class="company-details">
                <h2>COTARCO TECNOLOGIA, LDA.</h2>
                <p>Município de Talatona<br>Avenida Samora Machel</p>
                <p>NIF: 5402118515</p>
                <p>Tel.: +244 923 170 012 / +244 928 157 538<br>E-mail: geral@cotarco.com<br>Website: www.cotarco.com</p>
            </div>
        </div>

        <h1>FATURA-PROFORMA</h1>

        <div class="invoice-details">
            <div class="client-details">
                <h2>Cliente:</h2>
                <p>
                    <strong>{{ $order->user->name }}</strong><br>
                    {{ $order->user->partnerProfile->company_name ?? '' }}<br>
                    {{ $order->shipping_details['shippingAddress'] ?? '' }}<br>
                    {{ $order->shipping_details['city'] ?? '' }}<br>
                    Telefone: {{ $order->user->partnerProfile->phone_number ?? 'N/A' }}<br>
                </p>
            </div>
            <div class="invoice-info">
                <h2>Fatura-Proforma #{{ substr($order->id, 0, 8) }}</h2>
                <p>
                    <strong>Data da Fatura-Proforma:</strong> {{ now()->format('d/m/Y') }}<br>
                    <strong>Data da Encomenda:</strong> {{ \Carbon\Carbon::parse($order->created_at)->format('d/m/Y') }}<br>
                    <strong>Estado do Pagamento:</strong> {{ translateStatus($order->status) }}
                </p>
            </div>
        </div>

        <table class="items-table">
            <thead>
                <tr>
                    <th>Produto</th>
                    <th class="text-center">Qtd.</th>
                    <th class="text-right">Preço Unit.</th>
                    <th class="text-right">Subtotal</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($order->items as $item)
                    <tr>
                        <td>
                            {{ $item->name }}
                            <div style="font-size: 10px; color: #777;">REF: {{ $item->product_sku ?? 'N/A' }}</div>
                        </td>
                        <td class="text-center">{{ $item->quantity }}</td>
                        <td class="text-right">{{ number_format($item->price, 2, ',', '.') }} AOA</td>
                        <td class="text-right">{{ number_format($item->quantity * $item->price, 2, ',', '.') }} AOA</td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <div class="totals">
            <table>
                <tr>
                    <td class="total-label">Subtotal:</td>
                    <td class="text-right">{{ number_format($order->total_amount, 2, ',', '.') }} AOA</td>
                </tr>
                <tr>
                    <td class="total-label">IVA (0%):</td>
                    <td class="text-right">0,00 AOA</td>
                </tr>
                <tr class="grand-total">
                    <td class="total-label">Total:</td>
                    <td class="text-right">{{ number_format($order->total_amount, 2, ',', '.') }} AOA</td>
                </tr>
            </table>
        </div>

        <div class="footer">
            <p>Obrigado pela sua preferência!</p>
            <p>Este documento foi processado por computador.</p>
            <p>www.cotarco.com/distribuidores</p>
        </div>
    </div>
</body>
</html>
