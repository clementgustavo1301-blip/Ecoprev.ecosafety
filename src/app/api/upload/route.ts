import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const uploadedUrls = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name.replace(/[^a-zA-Z0-9.\-]/g, '_')}`;
      
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(uniqueName, buffer, {
          contentType: file.type,
          upsert: true
        });

      if (error) {
        console.error('Supabase upload error:', error);
        throw error;
      }

      // Supabase public URL
      const { data: publicUrlData } = supabase.storage
        .from('documents')
        .getPublicUrl(uniqueName);

      uploadedUrls.push(publicUrlData.publicUrl);
    }

    return NextResponse.json({ success: true, urls: uploadedUrls });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: "Failed to upload files" }, { status: 500 });
  }
}

