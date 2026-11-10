import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

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
    const { nome, descricao, tipo, frequencia, areaId, responsavelId, substitutoId } = body
    if (!nome?.trim()) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    if (!areaId) return NextResponse.json({ error: 'Área é obrigatória' }, { status: 400 })

    const processo = await db.processo.create({
      data: {
        nome: nome.trim(),
        descricao,
        tipo: tipo || 'Gestão',
        frequencia: frequencia || 'Mensal',
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
