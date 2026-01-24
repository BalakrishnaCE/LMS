import { LMS_API_BASE_URL } from "@/config/routes";

export interface APIResponse<T = any> {
    message: T;
}

export const useAPI = () => {
    const getLearnersData = async (): Promise<APIResponse> => {
        const response = await fetch(`${LMS_API_BASE_URL}/api/method/novel_lms.novel_lms.api.analytics.get_learners_data`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch learners data: ${response.statusText}`);
        }

        return response.json();
    };

    const addLearner = async (data: {
        email: string;
        full_name: string;
        first_name: string;
        last_name: string;
        mobile_no?: string;
        departments: string[];
        password?: string;
        send_welcome_email?: boolean;
    }): Promise<APIResponse> => {
        const response = await fetch(`${LMS_API_BASE_URL}/api/method/novel_lms.novel_lms.api.learners.add_learner`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Failed to add learner: ${response.statusText}`);
        }

        return response.json();
    };

    const updateLearner = async (data: {
        user_id: string;
        first_name: string;
        last_name: string;
        email: string;
        mobile_no?: string;
        enabled: number;
        departments: string[];
        password?: string;
    }): Promise<APIResponse> => {
        const response = await fetch(`${LMS_API_BASE_URL}/api/method/novel_lms.novel_lms.api.learners.update_learner`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Failed to update learner: ${response.statusText}`);
        }

        return response.json();
    };

    return {
        getLearnersData,
        addLearner,
        updateLearner,
    };
};
