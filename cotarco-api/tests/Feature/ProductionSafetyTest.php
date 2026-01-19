<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Support\Facades\File;

class ProductionSafetyTest extends TestCase
{
    /** @test */
    public function responses_should_never_contain_localhost_links()
    {
        // Routes to test. Using /api/test which is public.
        // Also checking root / if it returns something other than 404, but API usually doesn't have a root web route.
        // We'll focus on routes we know exist and might return links.
        $routes = ['/api/test'];

        foreach ($routes as $route) {
            $response = $this->get($route);
            
            // Check body content
            $content = $response->getContent();
            
            $this->assertStringNotContainsString('localhost', $content, "Error: Route {$route} returned a link to localhost!");
            $this->assertStringNotContainsString('127.0.0.1', $content, "Error: Route {$route} returned a link to 127.0.0.1!");
        }
    }

    /** @test */
    public function env_vars_are_production_safe()
    {
        // Only run this check if we are meant to be in production or if we manually override for this test
        // Ideally, we check the .env file directly to avoidphpunit.xml overrides
        $envPath = base_path('.env');
        
        if (!File::exists($envPath)) {
            $this->markTestSkipped('.env file not found.');
        }

        $envContent = File::get($envPath);
        
        // Simple parsing to find APP_ENV
        if (preg_match('/^APP_ENV=(.*)$/m', $envContent, $matches)) {
            $appEnv = trim($matches[1]);
            
            if ($appEnv === 'production') {
                // Check APP_URL
                if (preg_match('/^APP_URL=(.*)$/m', $envContent, $urlMatches)) {
                    $appUrl = trim($urlMatches[1]);
                    $this->assertStringNotContainsString('localhost', $appUrl, 'APP_URL in production .env should not be localhost');
                    $this->assertStringNotContainsString('127.0.0.1', $appUrl, 'APP_URL in production .env should not be 127.0.0.1');
                }

                // Check FRONTEND_URL
                if (preg_match('/^FRONTEND_URL=(.*)$/m', $envContent, $frontMatches)) {
                    $frontUrl = trim($frontMatches[1]);
                    $this->assertStringNotContainsString('localhost', $frontUrl, 'FRONTEND_URL in production .env should not be localhost');
                    $this->assertStringNotContainsString('127.0.0.1', $frontUrl, 'FRONTEND_URL in production .env should not be 127.0.0.1');
                }
            } else {
                $this->markTestSkipped("Current APP_ENV is '{$appEnv}', skipping production deployment checks.");
            }
        } else {
            $this->markTestSkipped('APP_ENV not found in .env file.');
        }
    }

    /** @test */
    public function codebase_should_not_have_hardcoded_localhost()
    {
        $pathsToCheck = [
            app_path(),
            config_path(),
        ];

        $forbiddenStrings = ['http://localhost', 'http://127.0.0.1', 'https://localhost'];
        
        // Whitelist specific files if necessary (e.g., this test file itself, or specific config defaults that are safe)
        // We whitelist this file obviously
        $whitelistedFiles = [
            basename(__FILE__),
            'sanctum.php', // Config defaults often have localhost
            'app.php',     // Config defaults
            'cors.php',
            'mail.php',
            'database.php',
            'queue.php'
            // We might want to fix the config files too, but usually defaults are fine. 
            // The user asked to search "outside of configuration or tests".
            // So let's focus mainly on app/ directory for strict enforcement.
        ];

        foreach ($pathsToCheck as $path) {
            $files = File::allFiles($path);

            foreach ($files as $file) {
                if (in_array($file->getFilename(), $whitelistedFiles)) {
                    continue;
                }
                
                // If checking config folder, maybe be more lenient or strict depending on user requst.
                // User said "Se encontrar qualquer coisa fora de arquivos de configuração ou testes".
                // So we will Skip config_path() loop if we want to follow that strictly, 
                // but checking app_path() is critical.
                if (str_contains($file->getPathname(), 'config')) {
                    continue;
                }

                $content = file_get_contents($file->getPathname());
                
                foreach ($forbiddenStrings as $string) {
                    if (str_contains($content, $string)) {
                        $this->fail("Found hardcoded '{$string}' in file: " . $file->getPathname());
                    }
                }
            }
        }

        // If we reached here, no forbidden strings were found, so we assert true to avoid "Risky" status
        $this->assertTrue(true, 'No hardcoded localhost strings found in codebase.');
    }
}
