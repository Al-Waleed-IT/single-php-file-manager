// File Manager Application
const { createApp } = Vue;
createApp({
    data() {
        return {
            currentPath: '',
            items: [],
            loading: false,
            error: null,
            successMessage: null,
            modals: { create: false, rename: false, view: false, password: false, compress: false },
            createType: 'directory',
            createName: '',
            renameItem: null,
            renameNewName: '',
            viewingFile: null,
            fileContent: '',
            compressItem: null,
            selectedFormat: 'zip',
            passwordData: { current: '', new: '', confirm: '' }
        };
    },
    computed: {
        breadcrumbs() {
            return this.currentPath ? this.currentPath.split('/').filter(p => p) : [];
        }
    },
    mounted() {
        this.loadDirectory();
    },
    methods: {
        async loadDirectory() {
            this.loading = true;
            this.error = null;
            try {
                const formData = new FormData();
                formData.append('path', this.currentPath);
                const response = await fetch('?action=list', { method: 'POST', body: formData });
                const data = await response.json();
                if (data.success) {
                    this.items = data.items.sort((a, b) => {
                        if (a.type === b.type) return a.name.localeCompare(b.name);
                        return a.type === 'directory' ? -1 : 1;
                    });
                } else {
                    this.error = data.error;
                }
            } catch (err) {
                this.error = 'Failed to load: ' + err.message;
            } finally {
                this.loading = false;
            }
        },
        navigateTo(path) {
            this.currentPath = path;
            this.loadDirectory();
        },
        navigateToBreadcrumb(index) {
            this.navigateTo(this.breadcrumbs.slice(0, index + 1).join('/'));
        },
        handleItemClick(item) {
            if (item.type === 'directory') {
                if (item.name === '..') {
                    const parts = this.currentPath.split('/').filter(p => p);
                    parts.pop();
                    this.navigateTo(parts.join('/'));
                } else {
                    this.navigateTo(item.path);
                }
            } else {
                this.viewFile(item);
            }
        },
        showCreateModal(type) {
            this.createType = type;
            this.createName = '';
            this.modals.create = true;
        },
        async createItem() {
            if (!this.createName.trim()) return;
            try {
                const formData = new FormData();
                formData.append('path', this.currentPath);
                formData.append('name', this.createName);
                formData.append('type', this.createType);
                const response = await fetch('?action=create', { method: 'POST', body: formData });
                const data = await response.json();
                if (data.success) {
                    this.showSuccess(data.message);
                    this.modals.create = false;
                    this.loadDirectory();
                } else {
                    this.error = data.error;
                }
            } catch (err) {
                this.error = 'Failed: ' + err.message;
            }
        },
        showRenameModal(item) {
            this.renameItem = item;
            this.renameNewName = item.name;
            this.modals.rename = true;
        },
        async renameItem() {
            if (!this.renameNewName.trim() || !this.renameItem) return;
            try {
                const formData = new FormData();
                formData.append('oldPath', this.renameItem.path);
                formData.append('newName', this.renameNewName);
                const response = await fetch('?action=rename', { method: 'POST', body: formData });
                const data = await response.json();
                if (data.success) {
                    this.showSuccess(data.message);
                    this.modals.rename = false;
                    this.loadDirectory();
                } else {
                    this.error = data.error;
                }
            } catch (err) {
                this.error = 'Failed: ' + err.message;
            }
        },
        async deleteItem(item) {
            if (!confirm('Delete "' + item.name + '"?')) return;
            try {
                const formData = new FormData();
                formData.append('path', item.path);
                const response = await fetch('?action=delete', { method: 'POST', body: formData });
                const data = await response.json();
                if (data.success) {
                    this.showSuccess(data.message);
                    this.loadDirectory();
                } else {
                    this.error = data.error;
                }
            } catch (err) {
                this.error = 'Failed: ' + err.message;
            }
        },
        async uploadFile(event) {
            const files = event.target.files;
            if (!files.length) return;
            for (let i = 0; i < files.length; i++) {
                try {
                    const formData = new FormData();
                    formData.append('path', this.currentPath);
                    formData.append('file', files[i]);
                    const response = await fetch('?action=upload', { method: 'POST', body: formData });
                    const data = await response.json();
                    if (data.success) {
                        this.showSuccess('Uploaded: ' + files[i].name);
                    } else {
                        this.error = data.error;
                    }
                } catch (err) {
                    this.error = 'Upload failed: ' + err.message;
                }
            }
            this.loadDirectory();
            event.target.value = '';
        },
        async viewFile(item) {
            try {
                const formData = new FormData();
                formData.append('path', item.path);
                const response = await fetch('?action=read', { method: 'POST', body: formData });
                const data = await response.json();
                if (data.success) {
                    this.viewingFile = item;
                    this.fileContent = data.content;
                    this.modals.view = true;
                } else {
                    this.error = data.error;
                }
            } catch (err) {
                this.error = 'Failed: ' + err.message;
            }
        },
        async saveFile() {
            if (!this.viewingFile) return;
            try {
                const formData = new FormData();
                formData.append('path', this.viewingFile.path);
                formData.append('content', this.fileContent);
                const response = await fetch('?action=write', { method: 'POST', body: formData });
                const data = await response.json();
                if (data.success) {
                    this.showSuccess(data.message);
                    this.closeViewModal();
                    this.loadDirectory();
                } else {
                    this.error = data.error;
                }
            } catch (err) {
                this.error = 'Failed: ' + err.message;
            }
        },
        showCompressModal(item) {
            this.compressItem = item;
            this.selectedFormat = 'zip';
            this.modals.compress = true;
        },
        async compress(item, format) {
            try {
                const formData = new FormData();
                formData.append('path', item.path);
                formData.append('format', format);
                const response = await fetch('?action=compress', { method: 'POST', body: formData });
                const data = await response.json();
                if (data.success) {
                    this.showSuccess(data.message);
                    this.modals.compress = false;
                    this.loadDirectory();
                } else {
                    this.error = data.error;
                }
            } catch (err) {
                this.error = 'Compress failed: ' + err.message;
            }
        },
        async extractItem(item) {
            if (!confirm('Extract "' + item.name + '"?')) return;
            try {
                const formData = new FormData();
                formData.append('path', item.path);
                const response = await fetch('?action=extract', { method: 'POST', body: formData });
                const data = await response.json();
                if (data.success) {
                    this.showSuccess(data.message);
                    this.loadDirectory();
                } else {
                    this.error = data.error;
                }
            } catch (err) {
                this.error = 'Extract failed: ' + err.message;
            }
        },
        isArchive(filename) {
            const ext = filename.split('.').pop().toLowerCase();
            return ['zip', 'tar', 'gz', 'bz2', 'xz'].includes(ext) || filename.match(/\.tar\.(gz|bz2|xz)$/i);
        },
        async changePassword() {
            if (!this.passwordData.current || !this.passwordData.new || !this.passwordData.confirm) {
                this.error = 'Fill all fields';
                return;
            }
            if (this.passwordData.new !== this.passwordData.confirm) {
                this.error = 'Passwords do not match';
                return;
            }
            if (this.passwordData.new.length < 6) {
                this.error = 'Min 6 characters';
                return;
            }
            try {
                const formData = new FormData();
                formData.append('currentPassword', this.passwordData.current);
                formData.append('newPassword', this.passwordData.new);
                const response = await fetch('?action=change_password', { method: 'POST', body: formData });
                const data = await response.json();
                if (data.success) {
                    this.showSuccess(data.message);
                    this.modals.password = false;
                    this.passwordData = { current: '', new: '', confirm: '' };
                } else {
                    this.error = data.error;
                }
            } catch (err) {
                this.error = 'Failed: ' + err.message;
            }
        },
        closeViewModal() {
            this.modals.view = false;
            this.viewingFile = null;
            this.fileContent = '';
        },
        downloadFile(item) {
            window.location.href = '?action=download&path=' + encodeURIComponent(item.path);
        },
        formatSize(bytes) {
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
        },
        formatDate(timestamp) {
            return new Date(timestamp * 1000).toLocaleString();
        },
        showSuccess(message) {
            this.successMessage = message;
            setTimeout(() => { this.successMessage = null; }, 3000);
        }
    }
}).mount('#app');
