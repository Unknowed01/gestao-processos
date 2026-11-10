import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/actividades
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const processoId = searchParams.get('processoId')
    const actividades = await db.actividade.findMany({
      where: processoId ? { processoId } : undefined,
      include: {
        processo: { select: { id: true, nome: true, area: { select: { nome: true } } } },
        responsavel: { select: { id: true, nome: true } },
        substituto: { select: { id: true, nome: true } },
        _count: { select: { tarefas: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(actividades)
  } catch (error) {
    console.error('Erro ao listar actividades:', error)
    return NextResponse.json({ error: 'Erro ao listar actividades' }, { status: 500 })
  }
}

// POST /api/actividades
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { nome, descricao, frequencia, processoId, responsavelId, substitutoId } = body
    if (!nome?.trim()) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    if (!processoId) return NextResponse.json({ error: 'Processo é obrigatório' }, { status: 400 })
    // Validação: responsável ≠ substituto
    if (responsavelId && substitutoId && responsavelId === substitutoId) {
      return NextResponse.json({ error: 'O responsável e o substituto não podem ser a mesma pessoa' }, { status: 400 })
    }

    const actividade = await db.actividade.create({
      data: {
        nome: nome.trim(),
        descricao,
        frequencia: frequencia || 'Mensal',
        processoId,
        responsavelId: responsavelId || null,
        substitutoId: substitutoId || null,
      },
      include: {
        processo: { select: { id: true, nome: true, area: { select: { nome: true } } } },
      },
    })
    return NextResponse.json(actividade, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar actividade:', error)
    return NextResponse.json({ error: 'Erro ao criar actividade' }, { status: 500 })
  }
}
