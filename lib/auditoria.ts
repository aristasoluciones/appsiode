export interface DataAuditoria {
  dispositivo: string;
  mac: string;
}

export function getDataAuditoria(): DataAuditoria {
  return {
    dispositivo: navigator.userAgent,
    mac: 'N/A', // browsers no exponen MAC
  };
}
