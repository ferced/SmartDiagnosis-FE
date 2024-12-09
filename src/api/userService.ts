import axiosInstance, { endpoints } from 'src/utils/axios';

export const getUser = async (username: string): Promise<any> => {
  const response = await axiosInstance.get(endpoints.user.details(username));
  return response.data;
};

export const getUsers = async (): Promise<any[]> => {
  const response = await axiosInstance.get(endpoints.user.list);
  return response.data;
};

export const createUser = async (userData: any): Promise<any> => {
  const response = await axiosInstance.post(endpoints.user.create, userData);
  return response.data;
};

export const updateUser = async (username: string, userData: any): Promise<any> => {
  const response = await axiosInstance.put(endpoints.user.update(username), userData);
  return response.data;
};

export const deleteUser = async (username: string): Promise<any> => {
  const response = await axiosInstance.delete(endpoints.user.delete(username));
  return response.data;
};
