export const reportGenerator = {
  convertToCSV(headers: string[], rows: any[][]): string {
    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        row.map(val => {
          const valStr = val === null || val === undefined ? '' : String(val);
          // Escape quotes
          if (valStr.includes(',') || valStr.includes('"') || valStr.includes('\n')) {
            return `"${valStr.replace(/"/g, '""')}"`;
          }
          return valStr;
        }).join(',')
      )
    ].join('\n');
    
    return csvContent;
  },

  downloadCSV(filename: string, csvContent: string): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
};
