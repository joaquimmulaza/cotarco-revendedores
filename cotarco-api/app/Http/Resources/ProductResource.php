<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this['id'],
            'name' => $this['name'],
            'price' => $this->extractNumericPrice($this['regular_price']),
            'formatted_price' => $this->formatPrice($this->extractNumericPrice($this['regular_price'])),
            'stock_status' => $this['stock_status'],
            'image_url' => $this->getFirstImageUrl(),
        ];
    }

    /**
     * Extrai o valor numérico do preço
     *
     * @param string|null $price
     * @return float
     */
    private function extractNumericPrice($price): float
    {
        if (empty($price)) {
            return 0.0;
        }

        // Remove caracteres não numéricos exceto ponto e vírgula
        $numericPrice = preg_replace('/[^0-9.,]/', '', $price);
        
        // Se estiver vazio após limpeza, retorna 0
        if (empty($numericPrice)) {
            return 0.0;
        }

        // Converte vírgula para ponto se necessário (formato português)
        $numericPrice = str_replace(',', '.', $numericPrice);
        
        return (float) $numericPrice;
    }

    /**
     * Formata o preço com o símbolo da moeda Kz
     *
     * @param float $price
     * @return string
     */
    private function formatPrice(float $price): string
    {
        if ($price == 0) {
            return '0,00Kz';
        }

        return number_format($price, 2, ',', '.') . 'Kz';
    }

    /**
     * Obtém a URL da primeira imagem
     *
     * @return string
     */
    private function getFirstImageUrl(): string
    {
        if (empty($this['images']) || !is_array($this['images']) || count($this['images']) === 0) {
            return '';
        }

        $firstImage = $this['images'][0];
        
        if (is_array($firstImage) && isset($firstImage['src'])) {
            return $firstImage['src'];
        }

        if (is_object($firstImage) && isset($firstImage->src)) {
            return $firstImage->src;
        }

        return '';
    }
}
