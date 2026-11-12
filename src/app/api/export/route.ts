import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as XLSX from 'xlsx'

// Sanitiza células para prevenir CSV/Excel formula injection (C4)
// Prefixa células que comecem com =, +, -, @, \t, \r, \n com apóstrofo
function sanitizeCell(v: unknown): string {
  const s = String(v ?? '')
  return /^[=+\-@\t\r\n]/.test(s) ? "'" + s : s
}

// Sanitiza todos os valores de um objecto (para XLSX json_to_sheet)
function sanitizeRow<T extends Record<string, unknown>>(row: T): Record<string, string> {
  const result: Record<string, string> = {}
  for (const key of Object.keys(row)) {
    result[key] = sanitizeCell(row[key])
  }
  return result
}

// GET /api/export?format=json|csv|xlsx&areas=areaId1,areaId2
// Exporta todos os dados (com filtro opcional por áreas)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const format = searchParams.get('format') || 'json' // json | csv | xlsx
    const areasParam = searchParams.get('areas') // comma-separated area IDs
    const areaIds = areasParam ? areasParam.split(',').filter(Boolean) : null

    // Filtro WHERE para áreas
    const areaFilter = areaIds && areaIds.length > 0 ? { areaId: { in: areaIds } } : undefined

    // Buscar todas as entidades (com relações)
    const [areas, processos, actividades, tarefas, membros, ferramentas, procedimentos] = await Promise.all([
      db.area.findMany({
        where: areaIds ? { id: { in: areaIds } } : undefined,
        orderBy: { nome: 'asc' },
      }),
      db.processo.findMany({
        where: areaFilter,
        include: {
          area: { select: { id: true, nome: true } },
          responsavel: { select: { id: true, nome: true } },
          substituto: { select: { id: true, nome: true } },
        },
        orderBy: { nome: 'asc' },
      }),
      db.actividade.findMany({
        where: areaFilter ? { processo: areaFilter } : undefined,
        include: {
          processo: { select: { id: true, nome: true, areaId: true } },
          responsavel: { select: { id: true, nome: true } },
          substituto: { select: { id: true, nome: true } },
        },
        orderBy: { nome: 'asc' },
      }),
      db.tarefa.findMany({
        where: areaFilter ? { actividade: { processo: areaFilter } } : undefined,
        include: {
          actividade: { select: { id: true, nome: true, processoId: true } },
          procedimentos: { orderBy: { passo: 'asc' } },
        },
        orderBy: { nome: 'asc' },
      }),
      db.membro.findMany({
        where: areaIds ? { areaId: { in: areaIds } } : undefined,
        include: { area: { select: { id: true, nome: true } } },
        orderBy: { nome: 'asc' },
      }),
      db.ferramenta.findMany({ orderBy: { nome: 'asc' } }),
      db.procedimento.findMany({
        where: areaFilter ? { tarefa: { actividade: { processo: areaFilter } } } : undefined,
        orderBy: { passo: 'asc' },
      }),
    ])

    // Estrutura completa dos dados
    const data = {
      metadata: {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        counts: {
          areas: areas.length,
          processos: processos.length,
          actividades: actividades.length,
          tarefas: tarefas.length,
          membros: membros.length,
          ferramentas: ferramentas.length,
          procedimentos: procedimentos.length,
        },
        filtros: areaIds ? { areas: areaIds.length } : null,
      },
      areas,
      processos: processos.map(p => ({
        ...p,
        kpis: p.kpis,
        obrigacoes: p.obrigacoes,
      })),
      actividades,
      tarefas: tarefas.map(t => ({
        id: t.id,
        nome: t.nome,
        descricao: t.descricao,
        inputs: t.inputs,
        outputs: t.outputs,
        instrucoesNasFerramentas: t.instrucoesNasFerramentas,
        ferramentaIds: t.ferramentaIds,
        actividadeId: t.actividadeId,
        dataRevisao: t.dataRevisao,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        procedimentos: t.procedimentos,
      })),
      membros,
      ferramentas,
      procedimentos,
    }

    if (format === 'json') {
      return NextResponse.json(data, {
        headers: {
          'Content-Disposition': `attachment; filename="gestao-processos-${Date.now()}.json"`,
        },
      })
    }

    if (format === 'csv') {
      // CSV plano — uma linha por tarefa com toda a hierarquia
      const rows: Record<string, string | boolean | number>[] = []
      for (const t of data.tarefas) {
        const act = data.actividades.find(a => a.id === t.actividadeId)
        const proc = act ? data.processos.find(p => p.id === act.processoId) : null
        const area = proc ? data.areas.find(a => a.id === proc.areaId) : null
        const resp = act?.responsavelId ? data.membros.find(m => m.id === act.responsavelId) : null
        const procResp = proc?.responsavelId ? data.membros.find(m => m.id === proc.responsavelId) : null
        const ferramentaNomes = t.ferramentaIds
          .split(',')
          .filter(Boolean)
          .map(id => data.ferramentas.find(f => f.id === id)?.nome)
          .filter(Boolean)
          .join('; ')
        const procs = t.procedimentos?.map((p, i) => `${i + 1}. ${p.descricao}`).join(' | ') || ''
        rows.push({
          Area: area?.nome || '',
          'Processo (Tipo)': proc ? `${proc.nome} (${proc.tipo})` : '',
          'Processo KPIs': proc?.kpis || '',
          'Processo Obrigações': proc?.obrigacoes || '',
          'Processo Responsável': procResp?.nome || '',
          Actividade: act?.nome || '',
          'Actividade Freq.': act?.frequencia || '',
          'Actividade Responsável': resp?.nome || '',
          Tarefa: t.nome,
          Inputs: t.inputs,
          Outputs: t.outputs,
          'Instruções nas ferramentas': t.instrucoesNasFerramentas ? 'Sim' : 'Não',
          Ferramentas: ferramentaNomes,
          Procedimentos: procs,
          'Data Revisão': new Date(t.dataRevisao).toLocaleString('pt-PT'),
        })
      }
      // Gerar CSV
      if (rows.length === 0) {
        return new NextResponse('Area,Processo,Tarefa\n,Nenhum dado encontrado,', {
          headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="export.csv"' },
        })
      }
      const headers = Object.keys(rows[0])
      const csvLines = [
        headers.join(';'),
        ...rows.map(r => headers.map(h => {
          // sanitizeCell previne formula injection (=, +, -, @, etc.)
          const s = sanitizeCell(r[h])
          // Escape de aspas e ponto-e-vírgula
          return s.includes(';') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
        }).join(';')),
      ]
      const csv = '\uFEFF' + csvLines.join('\n') // BOM para Excel reconhecer UTF-8
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="gestao-processos-${Date.now()}.csv"`,
        },
      })
    }

    if (format === 'xlsx') {
      // Excel com múltiplas sheets
      const wb = XLSX.utils.book_new()

      // Sheet: Tarefas (vista hierárquica completa)
      const tarefasRows = data.tarefas.map(t => {
        const act = data.actividades.find(a => a.id === t.actividadeId)
        const proc = act ? data.processos.find(p => p.id === act.processoId) : null
        const area = proc ? data.areas.find(a => a.id === proc.areaId) : null
        const resp = act?.responsavelId ? data.membros.find(m => m.id === act.responsavelId) : null
        const procResp = proc?.responsavelId ? data.membros.find(m => m.id === proc.responsavelId) : null
        const ferramentaNomes = t.ferramentaIds.split(',').filter(Boolean).map(id => data.ferramentas.find(f => f.id === id)?.nome).filter(Boolean).join('; ')
        return {
          Área: area?.nome || '',
          'Processo': proc?.nome || '',
          'Tipo': proc?.tipo || '',
          'Freq. Processo': proc?.frequencia || '',
          'KPIs': proc?.kpis || '',
          'Obrigações Regulamentares': proc?.obrigacoes || '',
          'Resp. Processo': procResp?.nome || '',
          'Actividade': act?.nome || '',
          'Freq. Actividade': act?.frequencia || '',
          'Resp. Actividade': resp?.nome || '',
          'Tarefa': t.nome,
          'Inputs': t.inputs,
          'Outputs': t.outputs,
          'Instruções nas ferramentas': t.instrucoesNasFerramentas ? 'Sim' : 'Não',
          'Ferramentas': ferramentaNomes,
          'Data Revisão': new Date(t.dataRevisao).toLocaleString('pt-PT'),
        }
      })
      const wsTarefas = XLSX.utils.json_to_sheet(tarefasRows.length > 0 ? tarefasRows.map(sanitizeRow) : [{ Info: 'Nenhum dado encontrado' }])
      XLSX.utils.book_append_sheet(wb, wsTarefas, 'Tarefas')

      // Sheet: Áreas
      const wsAreas = XLSX.utils.json_to_sheet(data.areas.map(a => sanitizeRow({
        Nome: a.nome,
        Descrição: a.descricao || '',
        Objectivos: a.objectivos || '',
      })))
      XLSX.utils.book_append_sheet(wb, wsAreas, 'Áreas')

      // Sheet: Processos
      const wsProcessos = XLSX.utils.json_to_sheet(data.processos.map(p => sanitizeRow({
        Nome: p.nome,
        Área: p.area?.nome || '',
        Tipo: p.tipo,
        Frequência: p.frequencia,
        Descrição: p.descricao || '',
        KPIs: p.kpis || '',
        'Obrigações Regulamentares': p.obrigacoes || '',
        Responsável: p.responsavel?.nome || '',
        Substituto: p.substituto?.nome || '',
      })))
      XLSX.utils.book_append_sheet(wb, wsProcessos, 'Processos')

      // Sheet: Actividades
      const wsActividades = XLSX.utils.json_to_sheet(data.actividades.map(a => sanitizeRow({
        Nome: a.nome,
        Processo: a.processo?.nome || '',
        Frequência: a.frequencia,
        Descrição: a.descricao || '',
        Responsável: a.responsavel?.nome || '',
        Substituto: a.substituto?.nome || '',
      })))
      XLSX.utils.book_append_sheet(wb, wsActividades, 'Actividades')

      // Sheet: Membros
      const wsMembros = XLSX.utils.json_to_sheet(data.membros.map(m => sanitizeRow({
        Nome: m.nome,
        Email: m.email || '',
        Cargo: m.cargo || '',
        Área: m.area?.nome || '',
      })))
      XLSX.utils.book_append_sheet(wb, wsMembros, 'Membros')

      // Sheet: Ferramentas
      const wsFerramentas = XLSX.utils.json_to_sheet(data.ferramentas.map(f => sanitizeRow({
        Nome: f.nome,
        Descrição: f.descricao || '',
      })))
      XLSX.utils.book_append_sheet(wb, wsFerramentas, 'Ferramentas')

      // Gerar buffer
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
      return new NextResponse(buf, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="gestao-processos-${Date.now()}.xlsx"`,
        },
      })
    }

    return NextResponse.json({ error: 'Formato não suportado. Use json, csv ou xlsx.' }, { status: 400 })
  } catch (error) {
    console.error('Erro ao exportar:', error)
    return NextResponse.json({ error: 'Erro ao exportar dados: ' + (error as Error).message }, { status: 500 })
  }
}
