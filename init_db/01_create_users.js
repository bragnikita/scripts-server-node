// dev user

var roles = [
    {role: "readWrite", db: 'script_editor'},
    {role: "dbAdmin", db: 'script_editor'}
];

db.getSiblingDB('script_editor').createUser(
    {
        user: 'script_editor__api',
        pwd: 'initial_password',
        roles: roles
    }
);