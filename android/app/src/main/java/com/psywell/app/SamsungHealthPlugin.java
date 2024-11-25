package com.psywell.app;

import android.util.Log;
import com.getcapacitor.Plugin;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.JSObject;
import com.getcapacitor.annotation.PluginMethod;
import com.samsung.android.sdk.healthdata.*;

import java.util.HashSet;

@CapacitorPlugin(name = "SamsungHealth")
public class SamsungHealthPlugin extends Plugin {

    private static final String TAG = "SamsungHealthPlugin";
    private HealthDataStore mStore;

    @PluginMethod
    public void initialize(PluginCall call) {
        try {
            mStore = new HealthDataStore(getContext(), connectionListener);
            mStore.connectService();
            Log.d(TAG, "Inicialización de Samsung Health iniciada.");
            call.resolve();
        } catch (Exception e) {
            Log.e(TAG, "Error al inicializar Samsung Health", e);
            call.reject("Error al inicializar Samsung Health", e);
        }
    }

    @PluginMethod
    public void requestPermissions(PluginCall call) {
        if (mStore == null) {
            Log.e(TAG, "HealthDataStore no está inicializado.");
            call.reject("HealthDataStore no inicializado. Llama a 'initialize' primero.");
            return;
        }

        try {
            HealthPermissionManager permissionManager = new HealthPermissionManager(mStore);
            HashSet<HealthPermissionManager.PermissionKey> permissions = new HashSet<>();

            // Agregar los permisos necesarios
            permissions.add(new HealthPermissionManager.PermissionKey("com.samsung.health.step_count", HealthPermissionManager.PermissionType.READ));
            permissions.add(new HealthPermissionManager.PermissionKey("com.samsung.health.heart_rate", HealthPermissionManager.PermissionType.READ));

            // Solicitar permisos al usuario
            permissionManager.requestPermissions(permissions, getActivity()).setResultListener(result -> {
                if (result.getResultMap().containsValue(Boolean.FALSE)) {
                    Log.e(TAG, "Algunos permisos no fueron otorgados.");
                    call.reject("No se otorgaron todos los permisos");
                } else {
                    Log.d(TAG, "Todos los permisos fueron otorgados.");
                    call.resolve();
                }
            });
        } catch (Exception e) {
            Log.e(TAG, "Error al solicitar permisos", e);
            call.reject("Error al solicitar permisos", e);
        }
    }

    @PluginMethod
    public void getSteps(PluginCall call) {
        if (mStore == null) {
            Log.e(TAG, "HealthDataStore no está inicializado.");
            call.reject("HealthDataStore no inicializado. Llama a 'initialize' primero.");
            return;
        }

        try {
            HealthDataResolver resolver = new HealthDataResolver(mStore, null);
            HealthDataResolver.Filter filter = HealthDataResolver.Filter.and(
                HealthDataResolver.Filter.greaterThanEquals("start_time", System.currentTimeMillis() - 86400000), // Últimas 24 horas
                HealthDataResolver.Filter.lessThan("start_time", System.currentTimeMillis())
            );

            HealthDataResolver.ReadRequest request = new HealthDataResolver.ReadRequest.Builder()
                .setDataType("com.samsung.health.step_count")
                .setFilter(filter)
                .build();

            resolver.read(request).setResultListener(result -> {
                int totalSteps = 0;
                for (HealthData data : result) {
                    totalSteps += data.getInt("count");
                }

                JSObject resultData = new JSObject();
                resultData.put("steps", totalSteps);
                Log.d(TAG, "Pasos obtenidos: " + totalSteps);
                call.resolve(resultData);
            });
        } catch (Exception e) {
            Log.e(TAG, "Error al obtener pasos", e);
            call.reject("Error al obtener pasos", e);
        }
    }

    private final HealthDataStore.ConnectionListener connectionListener = new HealthDataStore.ConnectionListener() {
        @Override
        public void onConnected() {
            Log.d(TAG, "Conexión establecida con Samsung Health.");
        }

        @Override
        public void onConnectionFailed(HealthConnectionErrorResult error) {
            Log.e(TAG, "Error de conexión: " + error.getErrorCode());
        }

        @Override
        public void onDisconnected() {
            Log.w(TAG, "Conexión con Samsung Health desconectada.");
        }
    };
}
