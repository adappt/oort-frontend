import { Page } from './page.model';
import { Role, User } from './user.model';

/*  Model for Application object.
*/
export interface Application {
    id?: string;
    name?: string;
    createdAt?: Date;
    modifiedAt?: Date;
    pages?: Page[];
    roles?: Role[];
    users?: User[];
    settings?: any;
    permissions?: any;
    canSee?: boolean;
    canCreate?: boolean;
    canUpdate?: boolean;
    canDelete?: boolean;
}
