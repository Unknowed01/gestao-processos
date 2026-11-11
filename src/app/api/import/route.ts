import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/import
// Recebe JSON com estrutura completa e importa (substituindo dados existentes)
// Body: { areas, processos, actividades, tarefas, membros, ferramentas, procedimentos, options }
// options: { replace: boolean } - se true, apaga tudo antes de importar

interface ImportData {
  areas?: any[]
  processos?: any[]
  actividades?: any[]
  tarefas?: any[]
  membros?: any[]
  ferramentas?: any[]
  procedimentos?: any[]
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { data, replace = false }: { data: ImportData; replace?: boolean } = body

    if (!data || typeof data !== 'object') {
      return NextResponse.json({ error: 'Dados inválidos. Envie um objecto com as entidades.' }, { status: 400 })
    }

    const result = {
      areas: 0, processos: 0, actividades: 0, tarefas: 0, membros: 0, ferramentas: 0, procedimentos: 0,
    }

    // Se replace=true, apaga tudo primeiro (ordem por dependências)
    if (replace) {
      await db.procedimento.deleteMany()
      await db.tarefa.deleteMany()
      await db.actividade.deleteMany()
      await db.processo.deleteMany()
      await db.membro.deleteMany()
      await db.ferramenta.deleteMany()
      await db.area.deleteMany()
    }

    // 1. Importar Áreas
    if (Array.isArray(data.areas)) {
      for (const a of data.areas) {
        if (!a.id || !a.nome) continue
        try {
          await db.area.upsert({
            where: { id: a.id },
            create: {
              id: a.id,
              nome: a.nome,
              descricao: a.descricao || null,
              objectivos: a.objectivos || null,
            },
            update: {
              nome: a.nome,
              descricao: a.descricao || null,
              objectivos: a.objectivos || null,
            },
          })
          result.areas++
        } catch (e) { console.error('Erro ao importar área:', a.id, e) }
      }
    }

    // 2. Importar Ferramentas (globais, sem área)
    if (Array.isArray(data.ferramentas)) {
      for (const f of data.ferramentas) {
        if (!f.id || !f.nome) continue
        try {
          await db.ferramenta.upsert({
            where: { id: f.id },
            create: { id: f.id, nome: f.nome, descricao: f.descricao || null },
            update: { nome: f.nome, descricao: f.descricao || null },
          })
          result.ferramentas++
        } catch (e) { console.error('Erro ao importar ferramenta:', f.id, e) }
      }
    }

    // 3. Importar Membros
    if (Array.isArray(data.membros)) {
      for (const m of data.membros) {
        if (!m.id || !m.nome) continue
        try {
          // Verifica se email já existe noutro membro
          if (m.email) {
            const existente = await db.membro.findFirst({ where: { email: m.email, NOT: { id: m.id } } })
            if (existente) continue // skip duplicado
          }
          await db.membro.upsert({
            where: { id: m.id },
            create: {
              id: m.id,
              nome: m.nome,
              email: m.email || null,
              cargo: m.cargo || null,
              areaId: m.areaId || null,
            },
            update: {
              nome: m.nome,
              email: m.email || null,
              cargo: m.cargo || null,
              areaId: m.areaId || null,
            },
          })
          result.membros++
        } catch (e) { console.error('Erro ao importar membro:', m.id, e) }
      }
    }

    // 4. Importar Processos
    if (Array.isArray(data.processos)) {
      for (const p of data.processos) {
        if (!p.id || !p.nome || !p.areaId) continue
        try {
          // Verifica se a área existe
          const area = await db.area.findUnique({ where: { id: p.areaId } })
          if (!area) continue
          await db.processo.upsert({
            where: { id: p.id },
            create: {
              id: p.id,
              nome: p.nome,
              descricao: p.descricao || null,
              tipo: p.tipo || 'Gestão',
              frequencia: p.frequencia || 'Mensal',
              kpis: p.kpis || null,
              obrigacoes: p.obrigacoes || null,
              areaId: p.areaId,
              responsavelId: p.responsavelId || null,
              substitutoId: p.substitutoId || null,
            },
            update: {
              nome: p.nome,
              descricao: p.descricao || null,
              tipo: p.tipo,
              frequencia: p.frequencia,
              kpis: p.kpis || null,
              obrigacoes: p.obrigacoes || null,
              areaId: p.areaId,
              responsavelId: p.responsavelId || null,
              substitutoId: p.substitutoId || null,
            },
          })
          result.processos++
        } catch (e) { console.error('Erro ao importar processo:', p.id, e) }
      }
    }

    // 5. Importar Actividades
    if (Array.isArray(data.actividades)) {
      for (const a of data.actividades) {
        if (!a.id || !a.nome || !a.processoId) continue
        try {
          const proc = await db.processo.findUnique({ where: { id: a.processoId } })
          if (!proc) continue
          await db.actividade.upsert({
            where: { id: a.id },
            create: {
              id: a.id,
              nome: a.nome,
              descricao: a.descricao || null,
              frequencia: a.frequencia || 'Mensal',
              processoId: a.processoId,
              responsavelId: a.responsavelId || null,
              substitutoId: a.substitutoId || null,
            },
            update: {
              nome: a.nome,
              descricao: a.descricao || null,
              frequencia: a.frequencia,
              processoId: a.processoId,
              responsavelId: a.responsavelId || null,
              substitutoId: a.substitutoId || null,
            },
          })
          result.actividades++
        } catch (e) { console.error('Erro ao importar actividade:', a.id, e) }
      }
    }

    // 6. Importar Tarefas
    if (Array.isArray(data.tarefas)) {
      for (const t of data.tarefas) {
        if (!t.id || !t.nome || !t.actividadeId) continue
        try {
          const act = await db.actividade.findUnique({ where: { id: t.actividadeId } })
          if (!act) continue
          await db.tarefa.upsert({
            where: { id: t.id },
            create: {
              id: t.id,
              nome: t.nome,
              descricao: t.descricao || null,
              inputs: t.inputs || '',
              outputs: t.outputs || '',
              instrucoesNasFerramentas: !!t.instrucoesNasFerramentas,
              ferramentaIds: t.ferramentaIds || '',
              actividadeId: t.actividadeId,
            },
            update: {
              nome: t.nome,
              descricao: t.descricao || null,
              inputs: t.inputs || '',
              outputs: t.outputs || '',
              instrucoesNasFerramentas: !!t.instrucoesNasFerramentas,
              ferramentaIds: t.ferramentaIds || '',
              actividadeId: t.actividadeId,
            },
          })
          result.tarefas++
        } catch (e) { console.error('Erro ao importar tarefa:', t.id, e) }
      }
    }

    // 7. Importar Procedimentos
    if (Array.isArray(data.procedimentos)) {
      for (const p of data.procedimentos) {
        if (!p.id || !p.tarefaId || !p.descricao) continue
        try {
          const tarefa = await db.tarefa.findUnique({ where: { id: p.tarefaId } })
          if (!tarefa) continue
          await db.procedimento.upsert({
            where: { id: p.id },
            create: {
              id: p.id,
              passo: p.passo || 1,
              descricao: p.descricao,
              tarefaId: p.tarefaId,
            },
            update: {
              passo: p.passo || 1,
              descricao: p.descricao,
              tarefaId: p.tarefaId,
            },
          })
          result.procedimentos++
        } catch (e) { console.error('Erro ao importar procedimento:', p.id, e) }
      }
    }

    return NextResponse.json({
      success: true,
      imported: result,
      message: `Importação concluída: ${result.areas} áreas, ${result.processos} processos, ${result.actividades} actividades, ${result.tarefas} tarefas, ${result.membros} membros, ${result.ferramentas} ferramentas, ${result.procedimentos} procedimentos.`,
    })
  } catch (error) {
    console.error('Erro ao importar:', error)
    return NextResponse.json({ error: 'Erro ao importar dados: ' + (error as Error).message }, { status: 500 })
  }
}
