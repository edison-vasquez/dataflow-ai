import jsPDF from 'jspdf';
import Papa from 'papaparse';

export function exportToCSV(data: any[], filename: string = 'export.csv') {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export function exportToPDF(metadata: { projectName: string; transformations: any[]; chartsCount: number }) {
    const doc = new jsPDF();

    // Style
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("DataFlow AI - Project Report", 20, 30);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 40);

    doc.setDrawColor(200);
    doc.line(20, 45, 190, 45);

    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("Summary", 20, 60);
    doc.setFontSize(11);
    doc.text(`Project Name: ${metadata.projectName}`, 20, 70);
    doc.text(`Visualizations Created: ${metadata.chartsCount}`, 20, 80);
    doc.text(`Transformations Applied: ${metadata.transformations.length}`, 20, 90);

    if (metadata.transformations.length > 0) {
        doc.setFontSize(14);
        doc.text("Audit Log", 20, 110);
        doc.setFontSize(10);
        metadata.transformations.forEach((t, i) => {
            doc.text(`${i + 1}. ${t.type} - ${new Date(t.timestamp).toLocaleTimeString()}`, 20, 120 + (i * 10));
        });
    }

    doc.save(`${metadata.projectName || 'DataFlow'}_Report.pdf`);
}
