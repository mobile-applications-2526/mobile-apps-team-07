import React from 'react';
import { Modal, View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';

interface ImageViewerModalProps {
    visible: boolean;
    imageUri: string | null;
    onClose: () => void;
}

export function ImageViewerModal({ visible, imageUri, onClose }: ImageViewerModalProps) {
    const insets = useSafeAreaInsets();

    if (!imageUri) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                {/* Close button */}
                {/* <TouchableOpacity
                    style={[styles.closeButton, { top: insets.top + 16 }]}
                    onPress={onClose}
                    activeOpacity={0.8}
                >
                    <View style={styles.closeButtonInner}>
                        <X size={24} color="#fff" />
                    </View>
                </TouchableOpacity> */}

                {/* Tap-to-dismiss overlay */}
                <TouchableOpacity
                    style={styles.touchOverlay}
                    activeOpacity={1}
                    onPress={onClose}
                >
                    <Image
                        source={{ uri: imageUri }}
                        style={styles.image}
                        resizeMode="contain"
                    />
                </TouchableOpacity>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
    },
    touchOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    closeButton: {
        position: 'absolute',
        right: 16,
        zIndex: 10,
    },
    closeButtonInner: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
