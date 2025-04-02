import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Image } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Audio } from 'expo-av'; // Importando expo-av
import lightOff from '../../assets/images/eco-light-off.png';
import lightOn from '../../assets/images/eco-light.png';
import { colors } from '../../constants/colors';

export default function Home() {
    const [hasPermission, setHasPermission] = useState(false);
    const [isTorchOn, setIsTorchOn] = useState(false);
    const [volume, setVolume] = useState(0.5); // Volume inicial (0.0 a 1.0)
    const [sound, setSound] = useState(null); // Estado para o objeto de som
    const cameraRef = useRef(null);
    const [permission, requestPermission] = useCameraPermissions();

    useEffect(() => {
        if (!permission) return;

        setHasPermission(permission.granted);
        if (!permission.granted) {
            (async () => {
                const newPermission = await requestPermission();
                setHasPermission(newPermission.granted);
            })();
        }

        // Configurar o modo de áudio e carregar um som de exemplo
        (async () => {
            await Audio.setAudioModeAsync({
                staysActiveInBackground: true,
                playThroughEarpieceAndroid: false,
            });

            // Carregar um som de exemplo (pode ser um arquivo local ou URL)
            const { sound: soundObject } = await Audio.Sound.createAsync(
                { uri: 'http://soundbible.com/mp3/Air Plane Ding-SoundBible.com-496729130.mp3' }, // Som de exemplo
                { shouldPlay: false } // Não toca automaticamente
            );
            setSound(soundObject);
            await soundObject.setVolumeAsync(volume); // Define o volume inicial
        })();

        // Limpeza ao desmontar o componente
        return () => {
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, [permission, requestPermission]);

    const toggleTorch = () => {
        if (cameraRef.current) {
            setIsTorchOn(prev => !prev);
        }
    };

    // Função para aumentar o volume
    const increaseVolume = async () => {
        const newVolume = Math.min(volume + 0.1, 1.0); // Aumenta em 10%, máximo 1.0
        if (sound) {
            await sound.setVolumeAsync(newVolume);
            setVolume(newVolume);
            // Toca o som brevemente para demonstrar o volume
            await sound.replayAsync();
        }
    };

    // Função para diminuir o volume
    const decreaseVolume = async () => {
        const newVolume = Math.max(volume - 0.1, 0.0); // Diminui em 10%, mínimo 0.0
        if (sound) {
            await sound.setVolumeAsync(newVolume);
            setVolume(newVolume);
            // Toca o som brevemente para demonstrar o volume
            await sound.replayAsync();
        }
    };

    if (hasPermission === null) {
        return <View />;
    }

    if (hasPermission === false) {
        return (
            <View style={styles.container}>
                <Text>Permissão negada</Text>
                <TouchableOpacity onPress={requestPermission}>
                    <Text>Solicitar permissão</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Câmera invisível, apenas para controle da lanterna */}
            <CameraView
                ref={cameraRef}
                style={styles.hiddenCamera}
                enableTorch={isTorchOn}
                facing="back"
            />
            <TouchableOpacity onPress={toggleTorch}>
                <Image style={styles.buttonImage} source={isTorchOn ? lightOn : lightOff} />
            </TouchableOpacity>

            {/* Botões de volume */}
            <View style={styles.volumeControls}>
                <TouchableOpacity style={styles.volumeButton} onPress={increaseVolume}>
                    <Text style={styles.volumeText}>+ Volume</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.volumeButton} onPress={decreaseVolume}>
                    <Text style={styles.volumeText}>- Volume</Text>
                </TouchableOpacity>
                <Text style={styles.volumeDisplay}>Volume: {(volume * 100).toFixed(0)}%</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.white,
    },
    hiddenCamera: {
        position: 'absolute',
        width: 1,
        height: 1,
        opacity: 0,
    },
    buttonImage: {
        width: 80,
        height: 80,
        resizeMode: 'cover',
    },
    volumeControls: {
        marginTop: 20,
        alignItems: 'center',
    },
    volumeButton: {
        backgroundColor: colors.gray,
        padding: 10,
        borderRadius: 5,
        marginVertical: 5,
    },
    volumeText: {
        color: colors.white,
        fontSize: 16,
    },
    volumeDisplay: {
        marginTop: 10,
        fontSize: 16,
    },
});