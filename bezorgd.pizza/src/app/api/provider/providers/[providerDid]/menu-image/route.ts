import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { NextResponse } from 'next/server'
import sharp from 'sharp'

import { isAuthorizedForProviderWorkspace } from '@/lib/provider-workspace/provider-workspace-auth'
import { toPublicRestaurantSlug } from '@/lib/public-routing/slug-resolver'

type MenuImageUploadResponse = {
  ok: boolean
  imageUrl?: string
  message?: string
}

function sanitizeFileNameSegment(value: string) {
  return toPublicRestaurantSlug(value) || 'image'
}

function getExtensionFromFile(file: File) {
  const fileNameExtension = path.extname(file.name).toLowerCase()

  if (fileNameExtension) {
    return fileNameExtension
  }

  switch (file.type) {
    case 'image/jpeg':
      return '.jpg'
    case 'image/png':
      return '.png'
    case 'image/webp':
      return '.webp'
    case 'image/gif':
      return '.gif'
    default:
      return '.bin'
  }
}

export async function POST(request: Request, context: { params: Promise<{ providerDid: string }> }) {
  const { providerDid } = await context.params
  const resolvedProviderDid = decodeURIComponent(providerDid)

  if (!(await isAuthorizedForProviderWorkspace(resolvedProviderDid))) {
    return NextResponse.json<MenuImageUploadResponse>(
      {
        ok: false,
        message: 'Open eerst de provider workspace voor dit restaurant.',
      },
      { status: 403 }
    )
  }

  const formData = await request.formData().catch(() => null)
  const file = formData?.get('file')

  if (!(file instanceof File)) {
    return NextResponse.json<MenuImageUploadResponse>(
      {
        ok: false,
        message: 'Upload een geldige afbeelding.',
      },
      { status: 400 }
    )
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json<MenuImageUploadResponse>(
      {
        ok: false,
        message: 'Kies een afbeeldingsbestand zoals jpg, png of webp.',
      },
      { status: 400 }
    )
  }

  if (file.size > 10_000_000) {
    return NextResponse.json<MenuImageUploadResponse>(
      {
        ok: false,
        message: 'De afbeelding is te groot. Houd het bestand onder ongeveer 10 MB.',
      },
      { status: 400 }
    )
  }

  const providerSlug = sanitizeFileNameSegment(resolvedProviderDid)
  const fileName = `${Date.now()}-${randomUUID()}-${sanitizeFileNameSegment(file.name.replace(/\.[^.]+$/, ''))}.webp`
  const relativeDirectory = path.join('uploads', 'provider-menu-images', providerSlug)
  const publicDirectory = path.join(process.cwd(), 'public', relativeDirectory)
  const absoluteFilePath = path.join(publicDirectory, fileName)
  const imageUrl = `/${path.posix.join('uploads', 'provider-menu-images', providerSlug, fileName)}`

  await mkdir(publicDirectory, { recursive: true })

  try {
    const imageBuffer = Buffer.from(await file.arrayBuffer())
    const image = sharp(imageBuffer)
    const metadata = await image.metadata()

    const targetWidth = 400
    const targetHeight = 600
    const targetAspectRatio = targetWidth / targetHeight

    const currentAspectRatio = (metadata.width ?? 1) / (metadata.height ?? 1)

    let processedImage = image

    if (Math.abs(currentAspectRatio - targetAspectRatio) > 0.01) {
      processedImage = image.resize(targetWidth, targetHeight, {
        fit: 'cover',
        position: 'center',
      })
    } else {
      processedImage = image.resize(targetWidth, targetHeight, {
        fit: 'inside',
        withoutEnlargement: false,
      })
    }

    const outputBuffer = await processedImage
      .webp({
        quality: 80,
        effort: 6,
      })
      .toBuffer()

    if (outputBuffer.length > 1_000_000) {
      return NextResponse.json<MenuImageUploadResponse>(
        {
          ok: false,
          message: 'De afbeelding is na verwerking nog te groot. Probeer een eenvoudigere afbeelding.',
        },
        { status: 400 }
      )
    }

    await writeFile(absoluteFilePath, outputBuffer)
  } catch (error) {
    return NextResponse.json<MenuImageUploadResponse>(
      {
        ok: false,
        message: 'De afbeelding kon niet worden verwerkt. Probeer een andere afbeelding.',
      },
      { status: 500 }
    )
  }

  return NextResponse.json<MenuImageUploadResponse>({
    ok: true,
    imageUrl,
  })
}
