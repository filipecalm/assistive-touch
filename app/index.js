import React, { useState, useEffect, useRef } from 'react'
import { View, StyleSheet, Text, TouchableOpacity, Image } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { VolumeManager } from 'react-native-volume-manager'
import lightOff from '../assets/images/eco-light-off.png'
import lightOn from '../assets/images/eco-light.png'
import { lightColors, darkColors } from '../constants/colors'
import { Feather } from '@expo/vector-icons'

export default function Home() {
    const [hasPermission, setHasPermission] = useState(false)
    const [isTorchOn, setIsTorchOn] = useState(false)
    const [isDarkMode, setIsDarkMode] = useState(false)
    const [volume, setVolume] = useState(0.5) // Valor padrão inicial
    const cameraRef = useRef(null)
    const [permission, requestPermission] = useCameraPermissions()

    // Selecionar as cores com base no modo
    const themeColors = isDarkMode ? darkColors : lightColors

    useEffect(() => {
        if (!permission) return

        setHasPermission(permission.granted)
        if (!permission.granted) {
            (async () => {
                const newPermission = await requestPermission()
                setHasPermission(newPermission.granted)
            })()
        }

        (async () => {
            try {
                const currentVolume = await VolumeManager.getVolume()
                // Verifica se o valor é um número válido entre 0 e 1
                if (typeof currentVolume === 'number' && !isNaN(currentVolume) && currentVolume >= 0 && currentVolume <= 1) {
                    setVolume(currentVolume)
                } else {
                    console.warn('Volume retornado inválido, usando valor padrão 0.5:', currentVolume)
                    setVolume(0.5) // Define valor padrão se inválido
                }
            } catch (error) {
                console.error('Erro ao obter volume:', error)
                setVolume(0.5) // Valor padrão em caso de erro
            }
        })()
    }, [permission, requestPermission])

    const toggleTorch = () => {
        if (cameraRef.current) {
            setIsTorchOn(prev => !prev)    // Alterna a lanterna
            setIsDarkMode(prev => !prev)   // Alterna o modo claro/escuro
        }
    }

    const increaseVolume = async () => {
        const newVolume = Math.min(volume + 0.1, 1.0)
        await VolumeManager.setVolume(newVolume)
        setVolume(newVolume)
    }

    const decreaseVolume = async () => {
        const newVolume = Math.max(volume - 0.1, 0.0)
        await VolumeManager.setVolume(newVolume)
        setVolume(newVolume)
    }

    if (hasPermission === null) {
        return <View />
    }

    if (hasPermission === false) {
        return (
            <View style={[styles.container, { backgroundColor: themeColors.background }]}>
                <Text style={{ color: themeColors.text }}>Permissão negada</Text>
                <TouchableOpacity onPress={requestPermission}>
                    <Text style={{ color: themeColors.primary }}>Solicitar permissão</Text>
                </TouchableOpacity>
            </View>
        )
    }

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            <CameraView
                ref={cameraRef}
                style={styles.hiddenCamera}
                enableTorch={isTorchOn}
                facing="back"
            />
            <TouchableOpacity onPress={toggleTorch}>
                <Image style={styles.buttonImage} source={isTorchOn ? lightOn : lightOff} />
            </TouchableOpacity>

            <View style={styles.volumeControls}>
                <TouchableOpacity
                    style={[styles.volumeButton, { backgroundColor: themeColors.primary }]}
                    onPress={decreaseVolume}
                >
                    <Feather name="minus-circle" size={22} color={themeColors.text} />
                </TouchableOpacity>
                <Text
                    style={[styles.volumeDisplay, { color: themeColors.text, borderColor: themeColors.primary }]}
                >
                    Volume: {isNaN(volume) ? '0' : (volume * 100).toFixed(0)}%
                </Text>
                <TouchableOpacity
                    style={[styles.volumeButton, { backgroundColor: themeColors.primary }]}
                    onPress={increaseVolume}
                >
                    <Feather name="plus-circle" size={22} color={themeColors.text} />
                </TouchableOpacity>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
        flexDirection: 'row',
        marginTop: 20,
        alignItems: 'center',
    },
    volumeButton: {
        padding: 14,
        borderRadius: 5,
        marginVertical: 5,
    },
    volumeDisplay: {
        height: 50,
        fontSize: 16,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        paddingHorizontal: 10,
        textAlignVertical: 'center',
    },
})