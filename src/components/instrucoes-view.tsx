'use client'

import {
  ArrowRight, BookOpen, Building2, CheckCircle2, CircleAlert, Info,
  Database, LayoutGrid, Users, Workflow, Wrench
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type GuideSection = 'dashboard' | 'areas' | 'membros' | 'ferramentas' | 'dados'

export function InstrucoesView({ onNavigate }: { onNavigate: (section: GuideSection) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-primary" />
          Instruções de utilização
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Um guia rápido para estruturar, documentar e acompanhar os processos da organização.
        </p>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Comece por estruturar o trabalho</CardTitle>
          <CardDescription>
            O sistema organiza a informação nesta sequência:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-sm">
            <GuideStep number="1" label="Área" />
            <ArrowRight className="hidden sm:block w-4 h-4 text-muted-foreground" />
            <GuideStep number="2" label="Processo" />
            <ArrowRight className="hidden sm:block w-4 h-4 text-muted-foreground" />
            <GuideStep number="3" label="Actividade" />
            <ArrowRight className="hidden sm:block w-4 h-4 text-muted-foreground" />
            <GuideStep number="4" label="Tarefa" />
          </div>
          <Button className="mt-4" size="sm" onClick={() => onNavigate('areas')}>
            Abrir organograma <ArrowRight className="w-3.5 h-3.5 ml-2" />
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GuideCard
          icon={Building2}
          title="1. Crie áreas e processos"
          description="No Organograma, crie uma área para cada unidade ou equipa da organização."
        >
          <ul className="space-y-2 text-sm text-muted-foreground">
            <GuideBullet>Abra a área e crie os processos que lhe pertencem.</GuideBullet>
            <GuideBullet>Indique o tipo, a frequência e, sempre que possível, o responsável e o substituto.</GuideBullet>
            <GuideBullet>Dentro de cada processo, registe as actividades e as tarefas que o compõem.</GuideBullet>
          </ul>
          <Button variant="outline" size="sm" className="mt-auto" onClick={() => onNavigate('areas')}>
            Ir para o Organograma <ArrowRight className="w-3.5 h-3.5 ml-2" />
          </Button>
        </GuideCard>

        <GuideCard
          icon={CheckCircle2}
          title="2. Descreva cada tarefa"
          description="Uma tarefa clara ajuda outra pessoa a executar o trabalho de forma consistente."
        >
          <ul className="space-y-2 text-sm text-muted-foreground">
            <GuideBullet>Preencha as entradas necessárias e o resultado esperado.</GuideBullet>
            <GuideBullet>Associe as ferramentas utilizadas e ordene os passos do procedimento.</GuideBullet>
            <GuideBullet>Marque “Instruções nas ferramentas” quando o modo de execução já estiver documentado na própria ferramenta.</GuideBullet>
          </ul>
          <div className="mt-auto flex items-start gap-2 rounded-md border bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
            <span>Para abrir ou editar uma tarefa, navegue pela árvore da área até à tarefa pretendida.</span>
          </div>
        </GuideCard>

        <GuideCard
          icon={Users}
          title="3. Registe a equipa"
          description="Cadastre os membros e associe-os às áreas em que trabalham."
        >
          <ul className="space-y-2 text-sm text-muted-foreground">
            <GuideBullet>Use a secção Membros para criar ou consultar pessoas.</GuideBullet>
            <GuideBullet>Ao editar processos e actividades, atribua um responsável e, se aplicável, um substituto.</GuideBullet>
            <GuideBullet>O responsável e o substituto devem ser pessoas diferentes.</GuideBullet>
          </ul>
          <Button variant="outline" size="sm" className="mt-auto" onClick={() => onNavigate('membros')}>
            Gerir membros <ArrowRight className="w-3.5 h-3.5 ml-2" />
          </Button>
        </GuideCard>

        <GuideCard
          icon={LayoutGrid}
          title="4. Acompanhe os alertas"
          description="O Dashboard resume a cobertura do mapeamento e destaca itens que precisam de atenção."
        >
          <ul className="space-y-2 text-sm text-muted-foreground">
            <GuideBullet>Abra os itens dos cartões para ir directamente ao registo a rever.</GuideBullet>
            <GuideBullet>Resolva áreas sem processos, processos sem responsável e tarefas sem instruções nas ferramentas.</GuideBullet>
            <GuideBullet>Consulte a actividade recente para acompanhar alterações.</GuideBullet>
          </ul>
          <Button variant="outline" size="sm" className="mt-auto" onClick={() => onNavigate('dashboard')}>
            Abrir Dashboard <ArrowRight className="w-3.5 h-3.5 ml-2" />
          </Button>
        </GuideCard>

        <GuideCard
          icon={Wrench}
          title="5. Mantenha ferramentas actualizadas"
          description="As ferramentas são partilhadas entre as áreas e podem ser associadas às tarefas."
        >
          <p className="text-sm text-muted-foreground">
            Registe cada ferramenta uma vez na secção Ferramentas. Depois, associe-a às tarefas em que é utilizada.
          </p>
          <Button variant="outline" size="sm" className="mt-auto" onClick={() => onNavigate('ferramentas')}>
            Gerir ferramentas <ArrowRight className="w-3.5 h-3.5 ml-2" />
          </Button>
        </GuideCard>

        <GuideCard
          icon={Database}
          title="6. Faça cópias e mova dados"
          description="Na secção Dados pode exportar cópias ou importar um ficheiro JSON."
        >
          <ul className="space-y-2 text-sm text-muted-foreground">
            <GuideBullet>Exporte em JSON para guardar a estrutura e poder voltar a importá-la.</GuideBullet>
            <GuideBullet>CSV e Excel são úteis para análise e partilha.</GuideBullet>
          </ul>
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 flex gap-2">
            <CircleAlert className="w-4 h-4 flex-shrink-0" />
            <span>A opção de substituir durante a importação apaga os dados actuais. Exporte uma cópia antes de a utilizar.</span>
          </div>
          <Button variant="outline" size="sm" className="mt-auto" onClick={() => onNavigate('dados')}>
            Abrir Gestão de Dados <ArrowRight className="w-3.5 h-3.5 ml-2" />
          </Button>
        </GuideCard>
      </div>
    </div>
  )
}

function GuideStep({ number, label }: { number: string; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-2">
      <span className="flex w-6 h-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
        {number}
      </span>
      <span className="font-medium">{label}</span>
    </div>
  )
}

function GuideCard({
  icon: Icon, title, description, children
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">{children}</CardContent>
    </Card>
  )
}

function GuideBullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-600" />
      <span>{children}</span>
    </li>
  )
}
