declare const Deno: {
  serve(handler: (req: Request) => Response | Promise<Response>): void;
  env: {
    get(name: string): string | undefined;
  };
};

declare module "https://esm.sh/@supabase/supabase-js@2.110.0" {
  export function createClient(url: string, key: string, options?: unknown): any;
}
