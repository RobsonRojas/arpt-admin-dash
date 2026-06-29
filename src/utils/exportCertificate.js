import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const exportToImage = async (elementId, filename = 'certificado.png') => {
    const element = document.getElementById(elementId);
    if (!element) return;

    try {
        const canvas = await html2canvas(element, { 
            scale: 2, 
            useCORS: true,
            allowTaint: true
        });
        const imgData = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = filename;
        link.href = imgData;
        link.click();
    } catch (error) {
        console.error('Error generating image:', error);
        throw error;
    }
};

export const exportToPdf = async (elementId, filename = 'certificado.pdf') => {
    const element = document.getElementById(elementId);
    if (!element) return;

    try {
        const canvas = await html2canvas(element, { 
            scale: 2, 
            useCORS: true,
            allowTaint: true
        });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: [canvas.width, canvas.height]
        });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(filename);
    } catch (error) {
        console.error('Error generating PDF:', error);
        throw error;
    }
};
