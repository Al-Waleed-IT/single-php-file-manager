// File Manager Application
const { createApp } = Vue;
createApp({
    data() {
        return {
            currentPath: '',
            items: [],
            selectedItems: [],
            loading: false,
            error: null,
            successMessage: null,
            modals: { create: false, rename: false, view: false, password: false, compress: false, move: false },
            createType: 'directory',
            createName: '',
            renameItem: null,
            renameNewName: '',
            viewingFile: null,
            fileContent: '',
            compressItem: null,
            selectedFormat: 'zip',
            passwordData: { current: '', new: '', confirm: '' },
            moveDestination: '',
            moveItems: [],
            moveBrowserPath: '',
            moveBrowserItems: [],
            moveBrowserLoading: false,
            moveBrowserError: null,
            contextMenu: { visible: false, x: 0, y: 0, item: null }
        };
    },
    computed: {
        breadcrumbs() {
            return this.currentPath ? this.currentPath.split('/').filter(p => p) : [];
        },
        selectableItems() {
            return this.items.filter(item => item.name !== '..');
        },
        selectedItemsData() {
            return this.items.filter(item => this.selectedItems.includes(item.path));
        },
        selectedCount() {
            return this.selectedItems.length;
        },
        allSelected() {
            return this.selectableItems.length > 0 &&
                this.selectableItems.every(item => this.selectedItems.includes(item.path));
        },
        moveBrowserBreadcrumbs() {
            return this.moveBrowserPath ? this.moveBrowserPath.split('/').filter(p => p) : [];
        },
        moveTitle() {
            if (!this.moveItems.length) return '';
            if (this.moveItems.length === 1) {
                const item = this.items.find(entry => entry.path === this.moveItems[0]);
                return item ? item.name : this.moveItems[0];
            }
            return this.moveItems.length + ' items';
        }
    },
    mounted() {
        this.loadDirectory();
        window.addEventListener('keydown', this.handleKeydown);
        window.addEventListener('click', this.closeContextMenu);
        window.addEventListener('scroll', this.closeContextMenu, true);
        window.addEventListener('resize', this.closeContextMenu);
    },
    beforeUnmount() {
        window.removeEventListener('keydown', this.handleKeydown);
        window.removeEventListener('click', this.closeContextMenu);
        window.removeEventListener('scroll', this.closeContextMenu, true);
        window.removeEventListener('resize', this.closeContextMenu);
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
                    this.selectedItems = [];
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
        isSelected(item) {
            return this.selectedItems.includes(item.path);
        },
        toggleItemSelection(item) {
            if (item.name === '..') return;
            const index = this.selectedItems.indexOf(item.path);
            if (index >= 0) {
                this.selectedItems.splice(index, 1);
            } else {
                this.selectedItems.push(item.path);
            }
        },
        toggleSelectAll() {
            if (this.allSelected) {
                this.selectedItems = [];
            } else {
                this.selectedItems = this.selectableItems.map(item => item.path);
            }
        },
        async loadMoveDirectory(path) {
            this.moveBrowserLoading = true;
            this.moveBrowserError = null;
            try {
                const formData = new FormData();
                formData.append('path', path || '');
                const response = await fetch('?action=list', { method: 'POST', body: formData });
                const data = await response.json();
                if (data.success) {
                    const directories = data.items.filter(item => item.type === 'directory' && item.name !== '.users.json');
                    const sorted = directories.sort((a, b) => {
                        if (a.name === '..') return -1;
                        if (b.name === '..') return 1;
                        return a.name.localeCompare(b.name);
                    });
                    this.moveBrowserItems = sorted;
                    this.moveBrowserPath = data.current || path || '';
                } else {
                    this.moveBrowserError = data.error;
                }
            } catch (err) {
                this.moveBrowserError = 'Failed to load folders: ' + err.message;
            } finally {
                this.moveBrowserLoading = false;
            }
        },
        navigateMoveBreadcrumb(index) {
            const path = this.moveBrowserBreadcrumbs.slice(0, index + 1).join('/');
            this.loadMoveDirectory(path);
        },
        openMoveFolder(item) {
            if (item.name === '..') {
                const parts = this.moveBrowserPath.split('/').filter(p => p);
                parts.pop();
                this.loadMoveDirectory(parts.join('/'));
                return;
            }
            this.loadMoveDirectory(item.path);
            this.setMoveDestination(item.path);
        },
        browseMoveDestination() {
            this.loadMoveDirectory(this.moveDestination || '');
        },
        setMoveDestination(path) {
            this.moveDestination = path || '';
        },
        showMoveModal(item, useSelection) {
            if (useSelection && this.selectedItems.length) {
                this.moveItems = [...this.selectedItems];
            } else if (item) {
                if (item.name === '..') return;
                this.moveItems = [item.path];
                if (!this.isSelected(item)) {
                    this.selectedItems = [item.path];
                }
            } else if (this.selectedItems.length) {
                this.moveItems = [...this.selectedItems];
            } else {
                return;
            }
            this.moveDestination = this.currentPath || '';
            this.loadMoveDirectory(this.currentPath || '');
            this.modals.move = true;
        },
        closeMoveModal() {
            this.modals.move = false;
            this.moveItems = [];
            this.moveDestination = '';
            this.moveBrowserPath = '';
            this.moveBrowserItems = [];
        },
        async performMove() {
            if (!this.moveItems.length) return;
            try {
                const formData = new FormData();
                this.moveItems.forEach(path => formData.append('paths[]', path));
                formData.append('destination', this.moveDestination || '');
                const response = await fetch('?action=move', { method: 'POST', body: formData });
                const data = await response.json();
                if (data.success) {
                    this.showSuccess(data.message);
                    this.closeMoveModal();
                    this.selectedItems = [];
                    this.loadDirectory();
                } else {
                    this.error = data.error;
                }
            } catch (err) {
                this.error = 'Move failed: ' + err.message;
            }
        },
        async bulkDelete() {
            if (!this.selectedItems.length) return;
            const count = this.selectedItems.length;
            if (!confirm(`Delete ${count} selected item${count > 1 ? 's' : ''}?`)) return;
            this.error = null;
            let deleted = 0;
            const errors = [];
            const paths = [...this.selectedItems];
            for (const path of paths) {
                try {
                    const formData = new FormData();
                    formData.append('path', path);
                    const response = await fetch('?action=delete', { method: 'POST', body: formData });
                    const data = await response.json();
                    if (data.success) {
                        deleted += 1;
                    } else {
                        errors.push(data.error || 'Delete failed');
                    }
                } catch (err) {
                    errors.push('Delete failed: ' + err.message);
                }
            }
            this.selectedItems = [];
            await this.loadDirectory();
            if (deleted) {
                this.showSuccess(`Deleted ${deleted} item${deleted > 1 ? 's' : ''}`);
            }
            if (errors.length) {
                this.error = errors[0] + (errors.length > 1 ? ` (+${errors.length - 1} more)` : '');
            }
        },
        handleKeydown(event) {
            if (event.key === 'Escape') {
                this.closeContextMenu();
            }
            if (!(event.ctrlKey || event.metaKey) || event.shiftKey) return;
            if (event.key.toLowerCase() !== 'a') return;
            const target = event.target;
            const tag = target && target.tagName ? target.tagName.toUpperCase() : '';
            if (tag === 'INPUT' || tag === 'TEXTAREA' || (target && target.isContentEditable)) return;
            event.preventDefault();
            this.toggleSelectAll();
        },
        openContextMenu(event, item) {
            if (item && item.name !== '..' && !this.isSelected(item)) {
                this.selectedItems = [item.path];
            }
            const menuWidth = 240;
            const menuHeight = item ? 310 : 220;
            const maxX = window.innerWidth - menuWidth - 12;
            const maxY = window.innerHeight - menuHeight - 12;
            const x = Math.max(12, Math.min(event.clientX, maxX));
            const y = Math.max(12, Math.min(event.clientY, maxY));
            this.contextMenu = { visible: true, x, y, item: item || null };
        },
        closeContextMenu() {
            if (this.contextMenu.visible) {
                this.contextMenu.visible = false;
                this.contextMenu.item = null;
            }
        },
        triggerUpload() {
            if (this.$refs.uploadInput) {
                this.$refs.uploadInput.click();
            }
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
