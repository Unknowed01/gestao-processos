import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { processoCreateSchema, validateOrError } from '@/lib/schemas'

// GET /api/processos
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const areaId = searchParams.get('areaId')
    const processos = await db.processo.findMany({
      where: areaId ? { areaId } : undefined,
      include: {
        area: { select: { id: true, nome: true } },
        responsavel: { select: { id: true, nome: true } },
        substituto: { select: { id: true, nome: true } },
        _count: { select: { actividades: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(processos)
  } catch (error) {
    console.error('Erro ao listar processos:', error)
    return NextResponse.json({ error: 'Erro ao listar processos' }, { status: 500 })
  }
}

// POST /api/processos
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validation = validateOrError(processoCreateSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    const { nome, descricao, tipo, frequencia, kpis, obrigacoes, areaId, responsavelId, substitutoId } = validation.data

    const processo = await db.processo.create({
      data: {
        nome,
        descricao,
        tipo,
        frequencia,
        kpis: kpis || null,
        obrigacoes: obrigacoes || null,
        areaId,
        responsavelId: responsavelId || null,
        substitutoId: substitutoId || null,
      },
      include: {
        area: { select: { id: true, nome: true } },
        responsavel: { select: { id: true, nome: true } },
        substituto: { select: { id: true, nome: true } },
      },
    })
    return NextResponse.json(processo, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar processo:', error)
    return NextResponse.json({ error: 'Erro ao criar processo' }, { status: 500 })
  }
}
