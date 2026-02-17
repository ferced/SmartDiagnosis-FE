import axios from 'axios';

import { HOST_API } from 'src/config-global';
import { IFile } from 'src/types/file';

export interface DocumentDTO {
  id: number;
  conversation_id: number;
  name: string;
  mime_type: string;
  s3_key: string;
  size: number;
  created_at: string;
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
    tags: [],
    isFavorited: false,
    shared: null,
    createdAt: doc.created_at,
    modifiedAt: doc.created_at,
  };
};

export const fetchDocuments = async (): Promise<IFile[]> => {
  const response = await axios.get<DocumentDTO[]>(`${HOST_API}/documents`, {
    headers: getAuthHeaders(),
  });

  return (response.data || []).map(mapDocumentToFile);
};

export const uploadDocuments = async (files: File[], conversationId?: number, description?: string) => {
  const uploaded: IFile[] = [];

  // If no conversationId is provided, create a new conversation first
  let targetConversationId = conversationId;
  if (targetConversationId === undefined || targetConversationId === null) {
    try {
      const convResponse = await axios.post(`${HOST_API}/conversation`, {}, {
        headers: getAuthHeaders(),
      });
      targetConversationId = convResponse.data.id;
    } catch (error) {
      console.error("Failed to create conversation for upload", error);
      throw new Error("Could not create conversation for file upload");
    }
  }

  /* eslint-disable no-restricted-syntax, no-await-in-loop */
  for (const file of files) {
    const formData = new FormData();
    formData.append('file', file);
    if (description) {
      formData.append('description', description);
    }

    const response = await axios.post<DocumentDTO>(`${HOST_API}/conversations/${targetConversationId}/documents`, formData, {
      headers: getAuthHeaders(),
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

export const getDocumentDownloadUrl = async (id: string): Promise<string> => {
  const response = await axios.get<{ url: string }>(`${HOST_API}/documents/${id}/download`, {
    headers: getAuthHeaders(),
  });
  return response.data.url;
};
