import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/processos/[id] - detalhe completo de um processo com suas actividades
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const processo = await db.processo.findUnique({
      where: { id },
      include: {
        area: { select: { id: true, nome: true } },
        responsavel: { select: { id: true, nome: true, cargo: true } },
        substituto: { select: { id: true, nome: true, cargo: true } },
        actividades: {
          include: {
            responsavel: { select: { id: true, nome: true } },
            substituto: { select: { id: true, nome: true } },
            _count: { select: { tarefas: true } },
          },
          orderBy: { nome: 'asc' },
        },
        _count: { select: { actividades: true } },
      },
    })
    if (!processo) return NextResponse.json({ error: 'Processo não encontrado' }, { status: 404 })
    return NextResponse.json(processo)
  } catch (error) {
    console.error('Erro ao obter processo:', error)
    return NextResponse.json({ error: 'Erro ao obter processo' }, { status: 500 })
  }
}

// PUT /api/processos/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { nome, descricao, tipo, frequencia, kpis, obrigacoes, areaId, responsavelId, substitutoId } = body
    if (!nome?.trim()) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    // Validação: responsável ≠ substituto
    if (responsavelId && substitutoId && responsavelId === substitutoId) {
      return NextResponse.json({ error: 'O responsável e o substituto não podem ser a mesma pessoa' }, { status: 400 })
    }
    const processo = await db.processo.update({
      where: { id },
      data: {
        nome: nome.trim(),
        descricao,
        tipo,
        frequencia,
        kpis: kpis ?? null,
        obrigacoes: obrigacoes ?? null,
        areaId,
        responsavelId: responsavelId || null,
        substitutoId: substitutoId || null,
      },
    })
    return NextResponse.json(processo)
  } catch (error) {
    console.error('Erro ao actualizar processo:', error)
    return NextResponse.json({ error: 'Erro ao actualizar processo' }, { status: 500 })
  }
}

// DELETE /api/processos/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.processo.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao eliminar processo:', error)
    return NextResponse.json({ error: 'Erro ao eliminar processo' }, { status: 500 })
  }
}
