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
            'price' => $this->getLocalPrice(),
            'formatted_price' => $this->formatPrice($this->getLocalPrice()),
            'stock_status' => $this['stock_status'],
            'image_url' => $this->getFirstImageUrl(),
        ];
    }

    /**
     * Obtém o preço local do produto
     *
     * @return float|null
     */
    private function getLocalPrice(): ?float
    {
        if (isset($this['local_price']) && $this['local_price'] !== null) {
            return (float) $this['local_price'];
        }

        return null;
    }

    /**
     * Formata o preço com o símbolo da moeda Kz
     *
     * @param float|null $price
     * @return string
     */
    private function formatPrice(?float $price): string
    {
        if ($price === null || $price == 0) {
            return 'Sob consulta';
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
        // Verificar se é uma variação com imagem individual
        if (isset($this['image']) && is_array($this['image']) && !empty($this['image']['src'])) {
            return $this['image']['src'];
        }

        // Verificar array de imagens (produto simples ou variação com múltiplas imagens)
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
