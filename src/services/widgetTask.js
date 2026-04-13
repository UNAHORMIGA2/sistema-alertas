import api from "./api";
import React from "react";
import { FlexWidget, TextWidget, requestWidgetUpdate } from "react-native-android-widget";
import { readCachedCitizenLocationForWidget } from "./citizenLocationCache";

function PanicWidgetUi() {
  return (
    <FlexWidget
      style={{
        height: 'wrap_content',
        width: 'fill_parent',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <FlexWidget
        style={{
          flex: 1,
          height: 100,
          marginRight: 6,
          backgroundColor: '#DC2626',
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
        }}
        clickAction="ALERTA_PANICO"
      >
        <TextWidget
          text="PÁNICO"
          style={{
            fontSize: 20,
            fontFamily: 'sans-serif-condensed-light',
            color: '#FFFFFF',
            fontWeight: 'bold',
          }}
        />
        <TextWidget
          text="(Policía)"
          style={{ fontSize: 12, color: '#FCA5A5', marginTop: 2 }}
        />
      </FlexWidget>

      <FlexWidget
        style={{
          flex: 1,
          height: 100,
          marginLeft: 6,
          backgroundColor: '#2563EB',
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
        }}
        clickAction="ALERTA_MEDICA"
      >
        <TextWidget
          text="MÉDICA"
          style={{
            fontSize: 20,
            fontFamily: 'sans-serif-condensed-light',
            color: '#FFFFFF',
            fontWeight: 'bold',
          }}
        />
        <TextWidget
          text="(Ambulancia)"
          style={{ fontSize: 12, color: '#93C5FD', marginTop: 2 }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}

export async function widgetTaskHandler(props) {
  const { widgetAction, clickAction, widgetInfo, renderWidget: renderWidgetToNative } = props;
  // Los toques del widget llegan en `clickAction`, no en `widgetAction` (ver registerHeadlessTask del paquete).
  const tapKind = clickAction || widgetAction;

  const shouldRefreshUi =
    widgetAction === "WIDGET_ADDED" ||
    widgetAction === "WIDGET_UPDATE" ||
    widgetAction === "WIDGET_RESIZED" ||
    tapKind === "ALERTA_PANICO" ||
    tapKind === "ALERTA_MEDICA";

  if (!shouldRefreshUi) {
    return;
  }

  if (tapKind === "ALERTA_PANICO" || tapKind === "ALERTA_MEDICA") {
    try {
      const tipo = tapKind === "ALERTA_PANICO" ? "panico" : "medica";
      const cached = await readCachedCitizenLocationForWidget();
      const lat = cached?.lat ?? 0;
      const lng = cached?.lng ?? 0;
      await api.post("/alertas", { tipo, lat, lng });
      console.log("Widget: Alerta enviada correctamente, tipo:", tipo);
    } catch (error) {
      console.error("Widget: Error al enviar alerta", error?.message);
    }
  }

  try {
    if (typeof renderWidgetToNative === "function") {
      renderWidgetToNative(<PanicWidgetUi />);
    } else {
      requestWidgetUpdate({
        widgetName: "PanicButtonWidget",
        renderWidget: () => <PanicWidgetUi />,
        widgetInfo,
      });
    }
  } catch {}
}
