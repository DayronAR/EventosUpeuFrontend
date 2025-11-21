import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface PagosConfigDTO {
  yapeNumber: string;
}

@Injectable({ providedIn: 'root' })
export class PagosService {
  constructor(private http: HttpClient) {}

  getConfig(): Observable<PagosConfigDTO> {
    return this.http.get<PagosConfigDTO>(`${environment.apiUrl}/pagos/config`);
  }
}