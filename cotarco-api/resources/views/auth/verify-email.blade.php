<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verificar Email - Cotarco</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #333;
            margin-bottom: 10px;
        }
        .content {
            margin-bottom: 30px;
        }
        .btn {
            display: inline-block;
            background: #007bff;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 5px;
            margin: 10px 5px;
        }
        .btn:hover {
            background: #0056b3;
        }
        .footer {
            text-align: center;
            color: #666;
            font-size: 14px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Verificar Email</h1>
            <p>Obrigado por se registrar!</p>
        </div>
        
        <div class="content">
            <p>Antes de continuar, verifique se recebeu um email de verificação.</p>
            <p>Se não recebeu o email, clique no botão abaixo para reenviar.</p>
            
            <form method="POST" action="{{ route('verification.send') }}">
                @csrf
                <button type="submit" class="btn">Reenviar Email de Verificação</button>
            </form>
            
            @if (session('status'))
                <div style="background: #d4edda; color: #155724; padding: 15px; border-radius: 5px; margin-top: 20px;">
                    {{ session('status') }}
                </div>
            @endif
        </div>
        
        <div class="footer">
            <p>Este é um email automático, por favor não responda.</p>
            <p>&copy; 2025 Cotarco. Todos os direitos reservados.</p>
        </div>
    </div>
</body>
</html>


