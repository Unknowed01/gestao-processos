import {
  Building2, Scale, TrendingUp, Megaphone, Cpu, Users, Briefcase,
  ShieldCheck, MessageSquare, Headphones, AlertTriangle, FileSearch,
  Wallet, Calculator, Receipt, BarChart3, Workflow, Coins, Activity,
  Banknote, Landmark, GraduationCap, Network, type LucideIcon
} from 'lucide-react'

export const AREA_ICONS: Record<string, LucideIcon> = {
  'Jurídico e Legal': Scale,
  'Gestão de Investimentos': TrendingUp,
  'Marketing e Comunicação': Megaphone,
  'Org. Inf. Tecnologias': Cpu,
  'Recursos Humanos e Admin': Users,
  'Corretagem': Briefcase,
  'Mediação': Network,
  'Banca': Landmark,
  'Directos e Institucionais': Banknote,
  'Inovação Comercial': GraduationCap,
  'Academia Comercial': GraduationCap,
  'Compliance Officer': ShieldCheck,
  'Centro Reclamações / Conduta de Mercado': MessageSquare,
  'Provedor Cliente': Headphones,
  'Gestão de Riscos': AlertTriangle,
  'Controlo Interno': ShieldCheck,
  'Auditoria Interna': FileSearch,
  'Subscrição e Gestão de Portfólio': FileSearch,
  'Gestão de Operações': Workflow,
  'Gestão de Sinistros': Activity,
  'Financeira e Cobranças': Wallet,
  'Contabilidade e Fiscalidade': Calculator,
  'Resseguro e Co-seguro': Coins,
  'Actuariado, Plan e Reporting': BarChart3,
}

export function getAreaIcon(nome: string): LucideIcon {
  return AREA_ICONS[nome] ?? Building2
}
