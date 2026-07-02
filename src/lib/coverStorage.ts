import { supabase } from './supabase'

const BUCKET = 'covers'

export async function uploadCover(userId: string, occasionId: string, blob: Blob): Promise<string> {
  const path = `${userId}/${occasionId}.jpg`
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: 'image/jpeg',
    upsert: true,
  })
  if (error) throw error
  return path
}

export async function removeCover(coverPath: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([coverPath])
  if (error) throw error
}

export async function getCoverSignedUrl(coverPath: string, updatedAt: string): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(coverPath, 3600)
  if (error) throw error
  return `${data.signedUrl}?v=${encodeURIComponent(updatedAt)}`
}

/** 直接下成 Blob（供出图画到 canvas 用，走 blob 不会污染 canvas、能正常 toBlob 导出）。 */
export async function downloadCover(coverPath: string): Promise<Blob> {
  const { data, error } = await supabase.storage.from(BUCKET).download(coverPath)
  if (error) throw error
  return data
}
