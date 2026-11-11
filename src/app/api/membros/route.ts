import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/membros - listar todos os membros da equipa
// Suporta ?areaId=xxx (filtrar por área) e ?q=xxx (pesquisa para autocomplete)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const areaId = searchParams.get('areaId')
    const q = searchParams.get('q')

    // Modo autocomplete: pesquisa rápida por nome/email, retorna 5 resultados
    if (q !== null) {
      const membros = await db.membro.findMany({
        where: {
          OR: [
            { nome: { contains: q } },
            { email: { contains: q } },
          ],
        },
        select: {
          id: true,
          nome: true,
          email: true,
          cargo: true,
          areaId: true,
          area: { select: { id: true, nome: true } },
        },
        take: 5,
        orderBy: { nome: 'asc' },
      })
      return NextResponse.json(membros)
    }

    const membros = await db.membro.findMany({
      where: areaId ? { areaId } : undefined,
      include: {
        area: { select: { id: true, nome: true } },
        _count: {
          select: {
            procResp: true,
            procSubst: true,
            actResp: true,
            actSubst: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(membros)
  } catch (error) {
    console.error('Erro ao listar membros:', error)
    return NextResponse.json({ error: 'Erro ao listar membros' }, { status: 500 })
  }
}

// POST /api/membros - criar novo membro da equipa
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { nome, email, cargo, areaId } = body
    if (!nome?.trim()) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }
    const membro = await db.membro.create({
      data: {
        nome: nome.trim(),
        email: email?.trim() || null,
        cargo: cargo?.trim() || null,
        areaId: areaId || null,
      },
      include: {
        area: { select: { id: true, nome: true } },
      },
    })
    return NextResponse.json(membro, { status: 201 })
  } catch (error: unknown) {
    console.error('Erro ao criar membro:', error)
    const msg = error && typeof error === 'object' && 'code' in error && error.code === 'P2002'
      ? 'Email já cadastrado'
      : 'Erro ao criar membro'
    return NextResponse.json({ error: msg }, { status: msg === 'Email já cadastrado' ? 400 : 500 })
  }
}
