<x-mail::message>
# Conta Reativada!

Prezado(a) **{{ $user->name }}**!

Informamos que a sua conta na rede de parceiros da Cotarco foi devidamente reativada.
A partir deste momento, o acesso ao painel está restabelecido, permitindo-lhe utilizar todos os recursos e funcionalidades disponíveis.
Caso necessite de esclarecimentos adicionais ou apoio técnico, a nossa equipa de suporte está à disposição.

<x-mail::button :url="$loginUrl">
Aceder ao Painel
</x-mail::button>

Atenciosamente,
<br>
Cotarco Tecnologias, Lda.
</x-mail::message>



