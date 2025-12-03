import axios from 'axios';

import { HOST_API } from 'src/config-global';
import { IFile } from 'src/types/file';

export interface DocumentDTO {
  id: number;
  user_id: number;
  patient_id?: number | null;
  name: string;
  description?: string;
  mime_type: string;
  size: number;
  created_at: string;
  updated_at: string;
}

const getAuthHeaders = () => {
  const token = sessionStorage.getItem('accessToken');
  if (!token) {
    throw new Error('No access token found in sessionStorage');
  }
  return {
    Authorization: `Bearer ${token}`,
  };
};

const mapDocumentToFile = (doc: DocumentDTO): IFile => {
  const extension = doc.name.includes('.') ? doc.name.split('.').pop() || '' : '';
  const type = extension.toLowerCase() || 'file';

  return {
    id: doc.id.toString(),
    name: doc.name,
    size: doc.size,
    type,
    url: `${HOST_API}/documents/${doc.id}/download`,
    tags: doc.description ? [doc.description] : [],
    isFavorited: false,
    shared: null,
    createdAt: doc.created_at,
    modifiedAt: doc.updated_at,
  };
};

export const fetchDocuments = async (): Promise<IFile[]> => {
  const response = await axios.get<DocumentDTO[]>(`${HOST_API}/documents`, {
    headers: getAuthHeaders(),
  });

  return (response.data || []).map(mapDocumentToFile);
};

export const uploadDocuments = async (files: File[], conversationId: number, description?: string) => {
  const uploaded: IFile[] = [];

  // Upload sequentially to keep it simple and avoid throttling
  // This can be improved later with parallel uploads and progress tracking
  // if needed.
  /* eslint-disable no-restricted-syntax */
  for (const file of files) {
    const formData = new FormData();
    formData.append('file', file);
    if (description) {
      formData.append('description', description);
    }

    const response = await axios.post<DocumentDTO>(`${HOST_API}/conversations/${conversationId}/documents`, formData, {
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'multipart/form-data',
      },
    });

    uploaded.push(mapDocumentToFile(response.data));
  }
  /* eslint-enable no-restricted-syntax */

  return uploaded;
};

export const deleteDocument = async (id: string) => {
  await axios.delete(`${HOST_API}/documents/${id}`, {
    headers: getAuthHeaders(),
  });
};


