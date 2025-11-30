
import { GoogleGenAI } from "@google/genai";
import { RiskPoint, MitigationPlan } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateMitigationPlan = async (riskPoint: RiskPoint): Promise<MitigationPlan> => {
  const modelId = "gemini-2.5-flash-lite"; // Low-latency model for interactive UI

  // Format water sources for the prompt if they exist
  const waterSourcesInfo = riskPoint.details?.waterSources 
    ? `Terdapat sumber air terdekat di koordinat: ${riskPoint.details.waterSources.map(w => `[${w.lat}, ${w.lng}]`).join(', ')}.`
    : "Tidak ada data sumber air spesifik.";

  const prompt = `
    Anda adalah ahli mitigasi bencana senior dan analis GIS untuk wilayah Indonesia (Pulau Sumatera).
    Berikan rencana mitigasi operasional dan taktis untuk situasi berikut:
    
    Lokasi: ${riskPoint.locationName}
    Jenis Bencana: ${riskPoint.type}
    Koordinat Utama: ${riskPoint.coords.lat}, ${riskPoint.coords.lng}
    Tingkat Keparahan: ${riskPoint.severity}
    Data Lapangan: ${riskPoint.description}
    Info Logistik: ${waterSourcesInfo}

    Berikan output dalam format JSON valid (tanpa markdown code block) dengan struktur:
    {
      "title": "Judul Laporan Situasi (Bahasa Indonesia)",
      "preventativeMeasures": ["Daftar 3-4 tindakan spesifik yang harus dilakukan SEBELUM bencana terjadi (Mitigasi Pencegahan)"],
      "duringDisasterActions": ["Daftar 3-4 tindakan kritis yang harus dilakukan SAAT bencana sedang berlangsung (Respon Aktif)"],
      "immediateActions": ["Daftar 3-4 tindakan pemulihan/evakuasi SETELAH puncak bencana (Tanggap Darurat Lanjutan)"],
      "resourceAllocation": "Satu kalimat tegas mengenai alokasi alat berat, personel, atau logistik berdasarkan lokasi ini.",
      "rawAnalysis": "Analisis geografis singkat (2 kalimat) mengenai pemicu bencana di titik koordinat ini."
    }
    
    Instruksi Khusus:
    1. Jika FIRE (Kebakaran): Wajib sebutkan cara pemanfaatan sumber air terdekat yang disebutkan di atas (jika ada) untuk pemadaman darurat.
    2. Jika FLOOD (Banjir): Fokus pada rute evakuasi dan pompa air.
    3. Jika LANDSLIDE (Longsor): Fokus pada penutupan jalan dan stabilisasi tanah.
    4. Jika WAVE (Ombak): Fokus pada larangan melaut dan pengamanan pantai.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const data = JSON.parse(text);
    return data as MitigationPlan;
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      title: "Gagal Memuat Analisis AI",
      preventativeMeasures: ["Periksa kesiapan alat peringatan dini.", "Lakukan simulasi evakuasi berkala."],
      duringDisasterActions: ["Ikuti arahan petugas lapangan.", "Cari tempat aman yang telah ditentukan."],
      immediateActions: ["Hubungi BPBD setempat segera."],
      resourceAllocation: "Data tidak tersedia.",
      rawAnalysis: "Koneksi ke sistem kecerdasan buatan terganggu."
    };
  }
};
