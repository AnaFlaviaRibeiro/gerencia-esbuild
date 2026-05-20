export interface Usuario {
  id: string;
  nome: string;
  email: string;
}

export interface RelatorioBuild {
  sucesso: boolean;
  duracaoMs: number;
  arquivosRecompilados: string[];
  arquivosIgnorados: string[];
  versao: string;
  commit?: string;
}
