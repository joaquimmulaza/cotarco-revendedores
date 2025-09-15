<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Registro Não Aprovado</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f44336; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .footer { text-align: center; color: #666; font-size: 12px; padding: 20px; }
        .contact-info { background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>❌ Registro Não Aprovado</h1>
        </div>
        
        <div class="content">
            <p>Olá <strong>{{ $user->name }}</strong>,</p>
            
            <p>Agradecemos o seu interesse em poder fazer parte da nossa rede de parceiro.</p>
            
            <p>Após uma análise cuidadosa da sua solicitação, informamos que <strong>não foi possível aprovar</strong> seu registro como parceiro neste momento.</p>
            
            <p>Esta decisão pode ter sido baseada em diversos fatores, incluindo:</p>
            <ul>
                <li>Documentação incompleta ou inadequada</li>
                <li>Requisitos mínimos não atendidos</li>
                <li>Outras questões específicas do processo de aprovação</li>
            </ul>
            
            <p>Atenciosamente,<br>
            <strong>Cotarco Tecnologias, Lda.</strong></p>
        </div>
        
        <div class="footer">
            <p>Este é um email automático, por favor não responda.</p>
            <p>&copy; {{ date('Y') }} Cotarco. Todos os direitos reservados.</p>
        </div>
    </div>
</body>
</html>
