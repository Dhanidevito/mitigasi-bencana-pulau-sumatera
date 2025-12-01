
import { GoogleGenAI } from "@google/genai";
import { RiskPoint, MitigationPlan } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateMitigationPlan = async (riskPoint: RiskPoint): Promise<MitigationPlan> => {
  const modelId = "gemini-2.5-flash-lite"; // Low-latency model for interactive UI

  // Format water sources for the prompt if they exist
  const waterSourcesInfo = riskPoint.details?.waterSources 
    ? `Terdapat sumber air terdekat di koordinat: ${riskPoint.details.waterSources.map(w => `[${w.lat}, ${w.lng}]`).join(', ')}.`
    : "Tidak ada data sumber air spesifik.";

  // Format Context from Technical Details
  let technicalContext = "";
  if (riskPoint.details) {
    if (riskPoint.details.magnitude) technicalContext += `Magnitudo Gempa: ${riskPoint.details.magnitude} SR. `;
    if (riskPoint.details.depth) technicalContext += `Kedalaman: ${riskPoint.details.depth} km. `;
  }

  const prompt = `
    Anda adalah ahli survival, SAR (Search and Rescue), dan analis GIS untuk wilayah Indonesia.
    Berikan rencana mitigasi operasional DAN tips survival personal untuk situasi berikut:
    
    SUMBER DATA: ${riskPoint.source === 'agency_api' ? "DATA RESMI PEMERINTAH (BMKG/BNPB) - TRUSTED" : "DATA SENSOR SATELIT - RAW"}
    Lokasi: ${riskPoint.locationName}
    Jenis Bencana: ${riskPoint.type}
    Koordinat Utama: ${riskPoint.coords.lat}, ${riskPoint.coords.lng}
    Tingkat Keparahan: ${riskPoint.severity}
    Data Lapangan: ${riskPoint.description}
    Konteks Teknis: ${technicalContext}
    Terakhir Terjadi: ${riskPoint.lastOccurrence || "Tidak diketahui"}
    Info Logistik: ${waterSourcesInfo}

    Berikan output dalam format JSON valid (tanpa markdown code block) dengan struktur:
    {
      "title": "Judul Laporan Situasi (Bahasa Indonesia)",
      "preventativeMeasures": ["Daftar 3-4 tindakan spesifik pra-bencana"],
      "duringDisasterActions": ["Daftar 3-4 tindakan kritis saat bencana"],
      "immediateActions": ["Daftar 3-4 tindakan pemulihan pasca bencana"],
      "survivalTips": ["Daftar 3-4 tips survival individu/lifehack praktis. Contoh: 'Gunakan filter air dari botol bekas', 'Teknik pernapasan 4-7-8 untuk panik', 'Cara sinyal SOS manual', dll."],
      "resourceAllocation": "Satu kalimat tegas alokasi logistik.",
      "rawAnalysis": "Analisis geografis singkat (2 kalimat).",
      "socialNews": ["2-3 headline berita/sosmed fiktif tapi realistis."]
    }
    
    Instruksi Khusus:
    1. FIRE: Sertakan cara membuat masker basah darurat.
    2. FLOOD: Sertakan cara membuat pelampung dari galon/botol bekas.
    3. EARTHQUAKE: Sertakan 'Triangle of Life' vs 'Drop Cover Hold On' dan cara memukul pipa untuk sinyal.
    4. VOLCANO: Sertakan cara melindungi mata dan paru-paru dari abu vulkanik tajam.
    5. Tips survival harus bisa dilakukan oleh orang awam dengan alat seadanya.
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
      survivalTips: ["Tetap tenang dan jangan panik.", "Hemat air minum dan baterai ponsel.", "Dengarkan radio lokal untuk update."],
      resourceAllocation: "Data tidak tersedia.",
      rawAnalysis: "Koneksi ke sistem kecerdasan buatan terganggu.",
      socialNews: ["Tidak ada update media sosial saat ini."]
    };
  }
};
