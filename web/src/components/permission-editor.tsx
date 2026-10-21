import { Alert, Checkbox, Spin, Tooltip } from 'antd';
import { CircleHelpIcon, ShieldAlertIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Permission, PermissionDescriptor } from '@/api/auth.ts';
import {
  closureOf,
  GROUP_ORDER,
  groupLabelKey,
  permissionEffectKey,
  permissionLabelKey
} from '@/lib/permissions.ts';

// The marker is the only risk signal left in the list: a plain question mark
// explains what a grant does, and the amber shield marks the ones that amount to
// full device control. Everything else stays in the tooltip, so thirteen grants
// still fit on one screen.
function markerOf(risk: PermissionDescriptor['risk']) {
  return risk === 'warn'
    ? { Icon: ShieldAlertIcon, className: 'text-amber-500' }
    : { Icon: CircleHelpIcon, className: 'text-neutral-500' };
}

type PermissionEditorProps = {
  // A default keeps the editor usable as an antd Form.Item child, which injects
  // value/onChange itself.
  value?: Permission[];
  // onChange is omitted for a read-only reference (an administrator holds every
  // grant, whatever its stored set says).
  onChange?: (permissions: Permission[]) => void;
  catalog: PermissionDescriptor[] | null;
  catalogFailed?: boolean;
};

// PermissionEditor renders the catalog the server serves: its groups, its risk
// marks and the grants one permission implies all come from there, so the editor
// cannot offer a grant the server does not enforce or hide one it does.
export const PermissionEditor = ({
  value = [],
  onChange,
  catalog,
  catalogFailed = false
}: PermissionEditorProps) => {
  const { t } = useTranslation();
  const labelOf = (permission: Permission) => t(permissionLabelKey(permission));
  const readOnly = !onChange;

  if (catalogFailed) {
    return (
      <Alert type="error" showIcon message={t('settings.account.permissions.catalogFailed')} />
    );
  }
  if (!catalog) {
    return (
      <div className="flex justify-center py-6">
        <Spin size="small" />
      </div>
    );
  }

  // Which selected grant brings each implied grant in, so the tooltip can say
  // where a checked-but-uneditable row comes from.
  const impliedSource = new Map<Permission, Permission>();
  for (const grant of value) {
    for (const implied of closureOf([grant], catalog)) {
      if (implied !== grant && !impliedSource.has(implied)) {
        impliedSource.set(implied, grant);
      }
    }
  }
  const resolved = closureOf(value, catalog);

  function toggle(permission: Permission, checked: boolean) {
    if (!onChange) return;
    onChange(checked ? [...value, permission] : value.filter((granted) => granted !== permission));
  }

  const sections = GROUP_ORDER.map((group) => ({
    group,
    items: catalog.filter((descriptor) => descriptor.group === group)
  })).filter((section) => section.items.length > 0);

  const fullControl = catalog
    .filter((descriptor) => descriptor.risk === 'warn' && resolved.has(descriptor.id))
    .map((descriptor) => labelOf(descriptor.id));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex max-h-[55vh] flex-col gap-3 overflow-auto pr-1">
        {sections.map((section) => (
          <div key={section.group}>
            <div className="mb-1 text-xs text-neutral-500">{t(groupLabelKey(section.group))}</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {section.items.map((descriptor) => {
                const granted = value.includes(descriptor.id);
                const source = impliedSource.get(descriptor.id);
                // A grant another selection already brings in is locked even when
                // the account also stores it explicitly: unchecking it would only
                // remove the stored copy and leave the closure to add it back, so
                // the box must not offer an edit that cannot take effect.
                const locked = source !== undefined;
                // The note explains a box that is checked on someone else's
                // account only. A grant the account stores itself is checked in
                // its own right, so naming a source would describe it backwards.
                const includedBy = !granted && source;
                const { Icon, className: markerClass } = markerOf(descriptor.risk);
                const effect = permissionEffectKey(descriptor.id);

                return (
                  <Checkbox
                    key={descriptor.id}
                    checked={granted || locked}
                    disabled={readOnly || locked}
                    onChange={(event) => toggle(descriptor.id, event.target.checked)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {labelOf(descriptor.id)}
                      <Tooltip
                        title={
                          <span>
                            {effect ? t(effect) : labelOf(descriptor.id)}
                            {includedBy && source && (
                              <span className="mt-1 block text-amber-300">
                                {t('settings.account.permissions.impliedBy', {
                                  name: labelOf(source)
                                })}
                              </span>
                            )}
                          </span>
                        }
                      >
                        {/* The icon sits inside the label, so it must not toggle the box */}
                        <span
                          className={`inline-flex shrink-0 cursor-help items-center ${markerClass}`}
                          tabIndex={0}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                          }}
                          onMouseDown={(event) => event.stopPropagation()}
                        >
                          <Icon size={12} />
                        </span>
                      </Tooltip>
                    </span>
                  </Checkbox>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* One line, below the grants: the marks above already say where it comes from */}
      {fullControl.length > 0 && (
        <div className="flex items-start gap-1 text-xs text-amber-500">
          <ShieldAlertIcon size={12} className="mt-0.5 shrink-0" />
          <span>
            {t('settings.account.permissions.fullControlWarning')} {fullControl.join(', ')}
          </span>
        </div>
      )}

      {value.length === 0 && (
        <div className="text-xs text-neutral-500">
          {t('settings.account.permissions.emptyWarning')}
        </div>
      )}
    </div>
  );
};
