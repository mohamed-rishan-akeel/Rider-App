import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    Alert,
    ScrollView,
    Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import SignatureCanvas from 'react-native-signature-canvas';
import { Button } from '../components/Common';
import { jobsAPI } from '../services/api';
import { getCurrentLocation } from '../services/location';
import { colors, spacing, typography, shadows } from '../styles/theme';

export default function ProofOfDeliveryScreen({ route, navigation }) {
    const { jobId } = route.params;
    const [photoUri, setPhotoUri] = useState(null);
    const [signature, setSignature] = useState(null);
    const [recipientName, setRecipientName] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [showSignaturePad, setShowSignaturePad] = useState(false);

    const handleTakePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Camera permission is required');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            quality: 0.7,
        });

        if (!result.canceled) {
            setPhotoUri(result.assets[0].uri);
        }
    };

    const handleSignature = (sig) => {
        setSignature(sig);
        setShowSignaturePad(false);
    };

    const handleSubmit = async () => {
        if (!photoUri && !signature) {
            Alert.alert('Required', 'Please capture a photo or signature');
            return;
        }

        setLoading(true);
        try {
            const location = await getCurrentLocation();

            const proofData = {
                photoUrl: photoUri, // In production, upload to cloud storage first
                signatureData: signature,
                recipientName,
                notes,
                latitude: location.latitude,
                longitude: location.longitude,
            };

            await jobsAPI.submitProof(jobId, proofData);

            Alert.alert('Success', 'Delivery completed!', [
                { text: 'OK', onPress: () => navigation.navigate('Home') },
            ]);
        } catch (error) {
            Alert.alert('Error', 'Failed to submit proof of delivery');
        } finally {
            setLoading(false);
        }
    };

    if (showSignaturePad) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Customer Signature</Text>
                <SignatureCanvas
                    onOK={handleSignature}
                    onEmpty={() => Alert.alert('Error', 'Please provide a signature')}
                    descriptionText="Sign here"
                    clearText="Clear"
                    confirmText="Save"
                    webStyle={`.m-signature-pad {box-shadow: none; border: 1px solid #e5e7eb;}`}
                />
                <Button
                    title="Cancel"
                    onPress={() => setShowSignaturePad(false)}
                    variant="outline"
                    style={styles.cancelButton}
                />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>Proof of Delivery</Text>

            <View style={styles.section}>
                <Text style={styles.label}>Delivery Photo</Text>
                {photoUri ? (
                    <View>
                        <Image source={{ uri: photoUri }} style={styles.photo} />
                        <Button
                            title="Retake Photo"
                            onPress={handleTakePhoto}
                            variant="outline"
                            style={styles.retakeButton}
                        />
                    </View>
                ) : (
                    <Button title="Take Photo" onPress={handleTakePhoto} />
                )}
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>Customer Signature</Text>
                {signature ? (
                    <View>
                        <Image
                            source={{ uri: signature }}
                            style={styles.signature}
                            resizeMode="contain"
                        />
                        <Button
                            title="Retake Signature"
                            onPress={() => setShowSignaturePad(true)}
                            variant="outline"
                            style={styles.retakeButton}
                        />
                    </View>
                ) : (
                    <Button
                        title="Capture Signature"
                        onPress={() => setShowSignaturePad(true)}
                    />
                )}
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>Recipient Name (Optional)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Who received the delivery?"
                    value={recipientName}
                    onChangeText={setRecipientName}
                    placeholderTextColor={colors.textSecondary}
                />
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>Notes (Optional)</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Any additional notes..."
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={4}
                    placeholderTextColor={colors.textSecondary}
                />
            </View>

            <Button
                title="Complete Delivery"
                onPress={handleSubmit}
                loading={loading}
                style={styles.submitButton}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        padding: spacing.lg,
    },
    title: {
        ...typography.h2,
        marginBottom: spacing.lg,
    },
    section: {
        marginBottom: spacing.lg,
    },
    label: {
        ...typography.h3,
        marginBottom: spacing.sm,
    },
    photo: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginBottom: spacing.sm,
    },
    signature: {
        width: '100%',
        height: 150,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        marginBottom: spacing.sm,
        backgroundColor: colors.surface,
    },
    retakeButton: {
        marginTop: 0,
    },
    input: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        ...typography.body,
        backgroundColor: colors.surface,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    submitButton: {
        marginTop: spacing.md,
    },
    cancelButton: {
        margin: spacing.lg,
    },
});
