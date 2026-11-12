import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { actividadeCreateSchema, validateOrError } from '@/lib/schemas'

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
    const validation = validateOrError(actividadeCreateSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    const { nome, descricao, frequencia, processoId, responsavelId, substitutoId } = validation.data

    const actividade = await db.actividade.create({
      data: {
        nome,
        descricao,
        frequencia,
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
