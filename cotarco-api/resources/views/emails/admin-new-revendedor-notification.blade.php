<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Novo Revendedor Registado</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0; }
        .footer { text-align: center; color: #666; font-size: 12px; padding: 20px; }
        .revendedor-info { background-color: #e5e7eb; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .revendedor-info h3 { margin-top: 0; color: #1f2937; }
        .info-item { margin: 8px 0; }
        .info-label { font-weight: bold; color: #374151; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔔 Novo Revendedor Registado</h1>
        </div>
        
        <div class="content">
            <p>Olá <strong>Administrador</strong>,</p>
            
            <p>Um novo revendedor completou o registro e confirmou o seu email. A conta está agora <strong>pendente de aprovação</strong> e aguarda a sua análise.</p>
            
            <div class="revendedor-info">
                <h3>📋 Dados do Revendedor</h3>
                <div class="info-item">
                    <span class="info-label">Nome:</span> {{ $revendedor->name }}
                </div>
                <div class="info-item">
                    <span class="info-label">Email:</span> {{ $revendedor->email }}
                </div>
                @if($revendedor->revendedorProfile)
                <div class="info-item">
                    <span class="info-label">Empresa:</span> {{ $revendedor->revendedorProfile->company_name }}
                </div>
                <div class="info-item">
                    <span class="info-label">Telefone:</span> {{ $revendedor->revendedorProfile->phone_number }}
                </div>
                @endif
                <div class="info-item">
                    <span class="info-label">Data de Registro:</span> {{ $revendedor->created_at->format('d/m/Y H:i') }}
                </div>
                <div class="info-item">
                    <span class="info-label">Status:</span> {{ $revendedor->status }}
                </div>
            </div>
            
            <p>Para analisar e aprovar/rejeitar este revendedor, acesse o painel administrativo:</p>
            
            <p style="text-align: center;">
                <a href="{{ $dashboardUrl }}" class="button">Acessar Painel Admin</a>
            </p>
            
            <p><strong>Ações necessárias:</strong></p>
            <ul>
                <li>Verificar os dados fornecidos pelo revendedor</li>
                <li>Analisar o documento de alvará enviado</li>
                <li>Aprovar ou rejeitar a solicitação</li>
            </ul>
            
            <p>O revendedor será notificado automaticamente após a sua decisão.</p>
            
            <p>Atenciosamente,<br>
            <strong>Sistema Cotarco</strong></p>
        </div>
        
        <div class="footer">
            <p>Este é um email automático do sistema de gestão de revendedores.</p>
            <p>&copy; {{ date('Y') }} Cotarco. Todos os direitos reservados.</p>
        </div>
    </div>
</body>
</html>
